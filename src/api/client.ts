const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function handleResponse(res: Response) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // Not JSON or empty
  }

  if (!res.ok) {
    const message = data?.error || data?.message || text || `Request failed (${res.status})`;
    throw new Error(message);
  }
  
  return data;
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
