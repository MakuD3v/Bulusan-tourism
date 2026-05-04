const BASE_URL = 'http://localhost:5000/api';

async function handleResponse(res: Response) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch {
      message = (await res.text()) || message;
    }
    throw new Error(message);
  }
  return res.json();
}

export const apiClient = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return handleResponse(res);
  },
  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  put: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return handleResponse(res);
  },
  upload: async (file: File) => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    return handleResponse(res);
  }
};
