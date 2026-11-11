import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const KEY = 'lb_token';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new ApiError(res.status, j.message ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/** multipart upload (PDF + cover); the browser sets the boundary header itself. */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, { method: 'POST', body: form, headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const first = j.errors ? (Object.values(j.errors) as string[][])[0]?.[0] : null;
    throw new ApiError(res.status, first ?? j.message ?? res.statusText);
  }
  return res.json();
}

/** GET helper with loading/error state and a reload() for after mutations. */
export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    api<T>(path).then(setData).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, [path]);
  useEffect(load, [load]);
  return { data, error, loading, reload: load };
}
