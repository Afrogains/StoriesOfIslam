import { appConfig } from '../config';

export interface ApiErrorShape {
  error?: { code?: string; message?: string; requestId?: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${appConfig.apiUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.accessToken
          ? { Authorization: `Bearer ${options.accessToken}` }
          : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiErrorShape;
      throw new ApiError(
        payload.error?.message ?? `Request failed (${response.status})`,
        response.status,
        payload.error?.code ?? 'request_failed',
        payload.error?.requestId,
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}
