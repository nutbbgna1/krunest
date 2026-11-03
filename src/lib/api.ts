let csrfToken = '';

export function setCsrfToken(value: string) {
  csrfToken = value;
}

export async function api<T>(path: string, init: Omit<RequestInit, 'body'> & { body?: unknown } = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...init.headers,
    },
    body: init.body !== undefined && typeof init.body !== 'string' ? JSON.stringify(init.body) : init.body as BodyInit,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ') as Error & { status?: number; data?: unknown };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as T;
}
