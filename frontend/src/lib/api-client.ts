export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  token?: string;
}

export async function apiRequest<T>(
  path: `/api/${string}`,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, token, ...requestOptions } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    ...requestOptions,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const error = data as Partial<ApiErrorBody> | undefined;
    throw new ApiError(
      error?.error ?? 'Something went wrong',
      response.status,
      error?.details,
    );
  }

  return data as T;
}
