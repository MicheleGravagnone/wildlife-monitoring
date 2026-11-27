import type { ApiError } from './types';

export const API_BASE = '/api/v1';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError | null;

  constructor(status: number, body: ApiError | null) {
    const msg = body?.message;
    super(Array.isArray(msg) ? msg.join('; ') : (msg ?? `HTTP ${status}`));
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | QueryValue[]>;

export function toSearch(query: Query | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue;
      params.append(key, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(
  path: string,
  { method = 'GET', query, body, signal }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}${toSearch(query)}`, {
    method,
    signal,
    credentials: 'include',
    headers:
      body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiRequestError(res.status, data as ApiError | null);
  return data as T;
}
