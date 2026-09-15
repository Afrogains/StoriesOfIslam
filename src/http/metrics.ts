import type { RequestHandler } from 'express';
import { getEnv } from '../config/env';
import { HttpError } from './errors';

const startedAt = Date.now();
const requests = new Map<string, number>();
let inFlight = 0;

function routeLabel(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\/+/g, '/')
    .slice(0, 120);
}

export const recordMetrics: RequestHandler = (request, response, next) => {
  inFlight += 1;
  response.on('finish', () => {
    inFlight = Math.max(0, inFlight - 1);
    const key = JSON.stringify([
      request.method,
      routeLabel(request.route?.path ?? request.path),
      response.statusCode,
    ]);
    requests.set(key, (requests.get(key) ?? 0) + 1);
  });
  next();
};

export const metricsEndpoint: RequestHandler = (request, response, next) => {
  const token = getEnv().METRICS_TOKEN;
  if (token && request.header('authorization') !== `Bearer ${token}`) {
    next(new HttpError(401, 'invalid_metrics_token', 'A valid metrics token is required'));
    return;
  }
  const lines = [
    '# HELP stories_process_uptime_seconds API process uptime.',
    '# TYPE stories_process_uptime_seconds gauge',
    `stories_process_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`,
    '# HELP stories_http_requests_in_flight Requests currently being served.',
    '# TYPE stories_http_requests_in_flight gauge',
    `stories_http_requests_in_flight ${inFlight}`,
    '# HELP stories_http_requests_total Completed API requests.',
    '# TYPE stories_http_requests_total counter',
  ];
  for (const [key, value] of requests) {
    const [method, route, status] = JSON.parse(key) as [string, string, number];
    lines.push(
      `stories_http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`,
    );
  }
  response.type('text/plain; version=0.0.4').send(`${lines.join('\n')}\n`);
};
