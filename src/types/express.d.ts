import type { AuthenticatedUser } from '../auth/keycloak';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
