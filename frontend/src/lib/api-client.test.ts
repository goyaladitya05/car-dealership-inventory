import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from './api-client';

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends JSON to relative API paths and returns the response body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'vehicle-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      apiRequest<{ id: string }>('/api/vehicles', {
        method: 'POST',
        body: { make: 'Tata' },
      }),
    ).resolves.toEqual({ id: 'vehicle-1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ make: 'Tata' }),
    });
  });

  it('attaches the bearer token when one is provided', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    await apiRequest('/api/vehicles', { token: 'signed-token' });

    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer signed-token',
      },
    });
  });

  it('throws the backend error and validation details', async () => {
    const details = [{ path: ['email'], message: 'Invalid email address' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Validation failed', details }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = apiRequest('/api/auth/register', {
      method: 'POST',
      body: { email: 'invalid', password: 'password123' },
    });

    await expect(request).rejects.toMatchObject({
      message: 'Validation failed',
      status: 400,
      details,
    });
  });
});
