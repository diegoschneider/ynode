import { getAuthHeaders, useAuthStore } from '../store/authStore';

const API_BASE = 'http://localhost:3001/api';

export interface Credential {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new ApiError(401, 'Session expired. Please login again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Request failed');
  }

  return data;
}

export async function fetchCredentials(): Promise<Credential[]> {
  const response = await fetch(`${API_BASE}/credentials`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<Credential[]>(response);
}

export async function createCredential(
  name: string,
  type: string,
  data: Record<string, string>
): Promise<Credential> {
  const response = await fetch(`${API_BASE}/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, type, data }),
  });
  return handleResponse<Credential>(response);
}

export async function deleteCredential(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/credentials/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });

  // Handle specific success response from DELETE which is { success: true }
  // handleResponse parses JSON, so it should be fine.
  await handleResponse<{ success: boolean }>(response);
}
