const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...init } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
