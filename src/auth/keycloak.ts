import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { type JwtHeader, type JwtPayload, type SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getEnv } from '../config/env';
import { HttpError } from '../http/errors';

export interface AuthenticatedUser {
  subject: string;
  email?: string;
  displayName?: string;
  roles: string[];
  token: string;
}

const env = getEnv();
const client = jwksClient({
  jwksUri: `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  timeout: 5000,
});

function signingKey(header: JwtHeader, callback: SigningKeyCallback): void {
  if (!header.kid) {
    callback(new Error('JWT is missing key id'));
    return;
  }
  client.getSigningKey(header.kid, (error, key) => {
    callback(error, key?.getPublicKey());
  });
}

function verifyToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      signingKey,
      {
        algorithms: ['RS256'],
        issuer: env.KEYCLOAK_ISSUER,
        audience: env.KEYCLOAK_AUDIENCE,
        clockTolerance: 5,
      },
      (error, decoded) => {
        if (error || !decoded || typeof decoded === 'string') {
          reject(error ?? new Error('Invalid access token'));
          return;
        }
        resolve(decoded);
      },
    );
  });
}

function bearerToken(request: Request): string | undefined {
  const authorization = request.header('authorization');
  if (!authorization?.startsWith('Bearer ')) return undefined;
  return authorization.slice('Bearer '.length).trim();
}

export const optionalAuth: RequestHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const token = bearerToken(request);
  if (!token) {
    next();
    return;
  }
  try {
    const claims = await verifyToken(token);
    const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
    request.user = {
      subject: String(claims.sub),
      email: typeof claims.email === 'string' ? claims.email : undefined,
      displayName:
        typeof claims.name === 'string'
          ? claims.name
          : typeof claims.preferred_username === 'string'
            ? claims.preferred_username
            : undefined,
      roles: realmAccess?.roles ?? [],
      token,
    };
    next();
  } catch {
    next(new HttpError(401, 'invalid_token', 'The access token is invalid or expired'));
  }
};

export const requireAuth: RequestHandler = (request, _response, next) => {
  if (!request.user) {
    next(new HttpError(401, 'authentication_required', 'Sign in is required'));
    return;
  }
  next();
};

export function requireRole(...roles: string[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user || !roles.some((role) => request.user?.roles.includes(role))) {
      next(new HttpError(403, 'insufficient_role', 'Your account cannot perform this action'));
      return;
    }
    next();
  };
}
