import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { getEnv } from '../config/env';

export const LOCAL_TOKEN_ISSUER = 'stories-of-islam-api';
export const LOCAL_TOKEN_AUDIENCE = 'stories-of-islam-app';
export const LOCAL_SUBJECT_PREFIX = 'local:';

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const DEV_SECRET = 'development-only-auth-secret-not-for-production-use';

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize('NFKC'), salt, KEY_LENGTH, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function signingSecret(): string {
  const env = getEnv();
  if (env.AUTH_JWT_SECRET) return env.AUTH_JWT_SECRET;
  if (env.NODE_ENV === 'production') throw new Error('AUTH_JWT_SECRET is not configured');
  return DEV_SECRET;
}

export type LocalTokenClaims = {
  profileId: string;
  email: string;
  name: string;
};

export function signAccessToken(claims: LocalTokenClaims): { token: string; expiresIn: number } {
  const expiresIn = getEnv().AUTH_ACCESS_TOKEN_TTL_SECONDS;
  const token = jwt.sign({ email: claims.email, name: claims.name }, signingSecret(), {
    algorithm: 'HS256',
    issuer: LOCAL_TOKEN_ISSUER,
    audience: LOCAL_TOKEN_AUDIENCE,
    subject: `${LOCAL_SUBJECT_PREFIX}${claims.profileId}`,
    expiresIn,
  });
  return { token, expiresIn };
}

/** Returns claims for a first-party token, or null when the token was issued elsewhere. */
export function isLocalToken(token: string): boolean {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded.payload === 'string') return false;
  return decoded.header.alg === 'HS256' && (decoded.payload as JwtPayload).iss === LOCAL_TOKEN_ISSUER;
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, signingSecret(), {
    algorithms: ['HS256'],
    issuer: LOCAL_TOKEN_ISSUER,
    audience: LOCAL_TOKEN_AUDIENCE,
    clockTolerance: 5,
  });
  if (typeof decoded === 'string' || !decoded.sub?.startsWith(LOCAL_SUBJECT_PREFIX)) {
    throw new Error('Invalid access token');
  }
  return decoded;
}

export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
