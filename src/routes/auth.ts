import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  hashPassword,
  hashRefreshToken,
  newRefreshToken,
  normalizeEmail,
  signAccessToken,
  verifyPassword,
} from '../auth/localAuth';
import { getEnv } from '../config/env';
import { HttpError, asyncHandler } from '../http/errors';
import { EmailTakenError, accountRepository, type AccountProfile } from '../repositories/accountRepository';

const PasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128)
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Use letters and at least one number');

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(320),
  password: PasswordSchema,
});

const LoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

const RefreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });

// Equalises response time for unknown emails so login cannot be used to probe accounts.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('not-a-real-password-0'));

async function issueSession(profile: AccountProfile, request: Request) {
  const env = getEnv();
  const access = signAccessToken({ profileId: profile.id, email: profile.email, name: profile.name });
  const refresh = newRefreshToken();
  await accountRepository.createSession(
    profile.id,
    refresh.hash,
    env.AUTH_REFRESH_TOKEN_TTL_DAYS,
    request.header('user-agent'),
  );
  return {
    user: { id: profile.id, name: profile.name, email: profile.email },
    accessToken: access.token,
    expiresIn: access.expiresIn,
    refreshToken: refresh.token,
  };
}

export const authRouter = Router();

authRouter.use(
  rateLimit({
    windowMs: 15 * 60_000,
    limit: () => (getEnv().NODE_ENV === 'test' ? 10_000 : 30),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'too_many_attempts', message: 'Too many attempts. Try again in a few minutes.' } },
  }),
);

authRouter.post(
  '/register',
  asyncHandler(async (request, response) => {
    const input = RegisterSchema.parse(request.body);
    const passwordHash = await hashPassword(input.password);
    try {
      const profile = await accountRepository.createAccount({
        email: normalizeEmail(input.email),
        name: input.name,
        passwordHash,
      });
      response.status(201).json({ data: await issueSession(profile, request) });
    } catch (error) {
      if (error instanceof EmailTakenError) {
        throw new HttpError(409, 'email_taken', 'An account with this email already exists. Sign in instead.');
      }
      throw error;
    }
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const input = LoginSchema.parse(request.body);
    const record = await accountRepository.findCredentials(normalizeEmail(input.email));
    if (record?.lockedUntil && record.lockedUntil.getTime() > Date.now()) {
      throw new HttpError(429, 'account_locked', 'Too many failed attempts. Try again in 15 minutes.');
    }
    const valid = await verifyPassword(input.password, record?.passwordHash ?? (await getDummyHash()));
    if (!record || !valid) {
      if (record) await accountRepository.recordLogin(record.id, false);
      throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect.');
    }
    await accountRepository.recordLogin(record.id, true);
    response.json({ data: await issueSession(record, request) });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (request, response) => {
    const { refreshToken } = RefreshSchema.parse(request.body);
    const env = getEnv();
    const next = newRefreshToken();
    const profileId = await accountRepository.rotateSession(
      hashRefreshToken(refreshToken),
      next.hash,
      env.AUTH_REFRESH_TOKEN_TTL_DAYS,
    );
    const profile = profileId ? await accountRepository.getProfile(profileId) : null;
    if (!profile) throw new HttpError(401, 'session_expired', 'Your session has ended. Sign in again.');
    const access = signAccessToken({ profileId: profile.id, email: profile.email, name: profile.name });
    response.json({
      data: {
        user: { id: profile.id, name: profile.name, email: profile.email },
        accessToken: access.token,
        expiresIn: access.expiresIn,
        refreshToken: next.token,
      },
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (request, response) => {
    const parsed = RefreshSchema.safeParse(request.body);
    if (parsed.success) await accountRepository.revokeSession(hashRefreshToken(parsed.data.refreshToken));
    response.status(204).end();
  }),
);
