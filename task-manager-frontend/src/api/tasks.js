const BASE = 'http://localhost:3000/api/tasks';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getTasks   = ()         => request('/');
export const getTask    = (id)       => request(`/${id}`);
export const createTask = (data)     => request('/', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id, data) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id)       => request(`/${id}`, { method: 'DELETE' });
