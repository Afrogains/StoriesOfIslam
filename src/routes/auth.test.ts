import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from '../auth/localAuth';
import { createApp } from '../http/app';
import type * as AccountRepositoryModule from '../repositories/accountRepository';
import type { AccountProfile } from '../repositories/accountRepository';
import type * as UserRepositoryModule from '../repositories/userRepository';

type Account = AccountProfile & { passwordHash: string };

const store = vi.hoisted(() => ({
  accounts: new Map<string, Account>(),
  sessions: new Map<string, { profileId: string; revoked: boolean }>(),
  quiz: [] as unknown[],
  games: [] as { profileId: string; score: number; section: string }[],
}));

vi.mock('../repositories/userRepository', async (importOriginal) => {
  const original = await importOriginal<typeof UserRepositoryModule>();
  return {
    ...original,
    ensureProfile: vi.fn(async (user: { subject: string }) => {
      const id = user.subject.replace(/^local:/, '');
      if (![...store.accounts.values()].some((account) => account.id === id)) {
        const { HttpError } = await import('../http/errors');
        throw new HttpError(401, 'account_deleted', 'This account no longer exists');
      }
      return id;
    }),
    userRepository: { ...original.userRepository, softDeleteAccount: vi.fn(async () => undefined) },
  };
});

vi.mock('../repositories/accountRepository', async (importOriginal) => {
  const original = await importOriginal<typeof AccountRepositoryModule>();
  const byId = (id: string) => [...store.accounts.values()].find((account) => account.id === id) ?? null;
  return {
    ...original,
    accountRepository: {
      createAccount: vi.fn(async (input: { email: string; name: string; passwordHash: string }) => {
        if (store.accounts.has(input.email)) throw new original.EmailTakenError();
        const account = { id: crypto.randomUUID(), ...input };
        store.accounts.set(input.email, account);
        return { id: account.id, email: account.email, name: account.name };
      }),
      findCredentials: vi.fn(async (email: string) => {
        const account = store.accounts.get(email);
        return account ? { ...account, failedAttempts: 0, lockedUntil: null } : null;
      }),
      recordLogin: vi.fn(async () => undefined),
      getProfile: vi.fn(async (id: string) => {
        const account = byId(id);
        return account ? { id: account.id, email: account.email, name: account.name } : null;
      }),
      createSession: vi.fn(async (profileId: string, hash: string) => {
        store.sessions.set(hash, { profileId, revoked: false });
      }),
      rotateSession: vi.fn(async (hash: string, nextHash: string) => {
        const session = store.sessions.get(hash);
        if (!session || session.revoked) return null;
        store.sessions.delete(hash);
        store.sessions.set(nextHash, session);
        return session.profileId;
      }),
      revokeSession: vi.fn(async (hash: string) => {
        const session = store.sessions.get(hash);
        if (session) session.revoked = true;
      }),
      deleteLocalAccount: vi.fn(async (profileId: string) => {
        for (const [email, account] of store.accounts) if (account.id === profileId) store.accounts.delete(email);
      }),
      upsertQuizResults: vi.fn(async (_profileId: string, results: unknown[]) => {
        store.quiz.push(...results);
      }),
      listQuizResults: vi.fn(async () => store.quiz),
      addGameScore: vi.fn(async (profileId: string, score: { score: number; section: string }) => {
        store.games.push({ profileId, ...score });
      }),
      gameSummary: vi.fn(async (profileId: string) => ({
        games: store.games.filter((game) => game.profileId === profileId).length,
        best: { all: Math.max(0, ...store.games.filter((game) => game.profileId === profileId).map((game) => game.score)) },
      })),
      leaderboard: vi.fn(async (_section: string, viewer?: string) =>
        store.games.map((game) => ({ name: 'Reader', score: game.score, isYou: game.profileId === viewer })),
      ),
    },
  };
});

const app = createApp();
const credentials = { name: 'Aisha Bello', email: 'Aisha@Example.com', password: 'sabr2026x' };

describe('email/password accounts', () => {
  beforeEach(() => {
    store.accounts.clear();
    store.sessions.clear();
    store.quiz.length = 0;
    store.games.length = 0;
  });

  it('hashes passwords with scrypt and verifies them', async () => {
    const hash = await hashPassword('correct horse 1');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash).not.toContain('correct horse');
    await expect(verifyPassword('correct horse 1', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong horse 1', hash)).resolves.toBe(false);
  });

  it('registers, signs in, refreshes, reads the profile and logs out', async () => {
    const register = await request(app).post('/v1/auth/register').send(credentials);
    expect(register.status).toBe(201);
    expect(register.body.data.user).toMatchObject({ name: 'Aisha Bello', email: 'aisha@example.com' });
    expect(register.body.data.accessToken).toBeTruthy();
    expect(JSON.stringify(register.body)).not.toContain('sabr2026x');

    const duplicate = await request(app).post('/v1/auth/register').send(credentials);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('email_taken');

    const wrong = await request(app)
      .post('/v1/auth/login')
      .send({ email: credentials.email, password: 'not-it-123' });
    expect(wrong.status).toBe(401);
    const unknown = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'not-it-123' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe(wrong.body.error.code);

    const login = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'aisha@example.com', password: credentials.password });
    expect(login.status).toBe(200);
    const { accessToken, refreshToken } = login.body.data;

    const profile = await request(app).get('/v1/me/profile').set('Authorization', `Bearer ${accessToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.email).toBe('aisha@example.com');

    const refreshed = await request(app).post('/v1/auth/refresh').send({ refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.refreshToken).not.toBe(refreshToken);
    const reused = await request(app).post('/v1/auth/refresh').send({ refreshToken });
    expect(reused.status).toBe(401);

    const logout = await request(app)
      .post('/v1/auth/logout')
      .send({ refreshToken: refreshed.body.data.refreshToken });
    expect(logout.status).toBe(204);
    const afterLogout = await request(app)
      .post('/v1/auth/refresh')
      .send({ refreshToken: refreshed.body.data.refreshToken });
    expect(afterLogout.status).toBe(401);
  });

  it('rejects weak passwords and invalid tokens', async () => {
    const weak = await request(app)
      .post('/v1/auth/register')
      .send({ ...credentials, password: 'short' });
    expect(weak.status).toBe(400);
    const forged = await request(app).get('/v1/me/profile').set('Authorization', 'Bearer not.a.token');
    expect(forged.status).toBe(401);
    const anonymous = await request(app).get('/v1/me/quiz-results');
    expect(anonymous.status).toBe(401);
  });

  it('stores quiz results and game scores for the signed-in user', async () => {
    const register = await request(app).post('/v1/auth/register').send(credentials);
    const auth = { Authorization: `Bearer ${register.body.data.accessToken}` };
    const completedAt = new Date().toISOString();

    const quiz = await request(app)
      .post('/v1/me/quiz-results')
      .set(auth)
      .send({ results: [{ storyId: 'sahabah-chapter-bilal', chapterIndex: 1, score: 4, total: 5, completedAt }] });
    expect(quiz.status).toBe(204);
    const badQuiz = await request(app)
      .post('/v1/me/quiz-results')
      .set(auth)
      .send({ results: [{ storyId: 'x', chapterIndex: 0, score: 6, total: 5, completedAt }] });
    expect(badQuiz.status).toBe(400);
    const listed = await request(app).get('/v1/me/quiz-results').set(auth);
    expect(listed.body.data).toHaveLength(1);

    const game = await request(app)
      .post('/v1/me/game-scores')
      .set(auth)
      .send({ section: 'all', score: 1200, correct: 8, total: 10, bestStreak: 5, playedAt: completedAt });
    expect(game.status).toBe(201);
    expect(game.body.data.best.all).toBe(1200);

    const board = await request(app).get('/v1/game/leaderboard').set(auth);
    expect(board.status).toBe(200);
    expect(board.body.data[0]).toMatchObject({ score: 1200, isYou: true });
  });

  it('deletes a local account and blocks its token afterwards', async () => {
    const register = await request(app).post('/v1/auth/register').send(credentials);
    const auth = { Authorization: `Bearer ${register.body.data.accessToken}` };
    const removed = await request(app).delete('/v1/me').set(auth);
    expect(removed.status).toBe(204);
    const after = await request(app).get('/v1/me/profile').set(auth);
    expect(after.status).toBe(401);
    const login = await request(app).post('/v1/auth/login').send(credentials);
    expect(login.status).toBe(401);
  });
});
