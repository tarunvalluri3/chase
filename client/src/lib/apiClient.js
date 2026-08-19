const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Set once Clerk has initialized, so every request can attach a fresh session token.
// See src/lib/clerk.js.
let getToken = async () => null;

export function setAuthTokenGetter(fn) {
  getToken = fn;
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const token = await getToken();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = payload?.error?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload?.error?.details);
  }

  return payload;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, body, options) => request(path, { ...options, method: 'DELETE', body }),
};

// Route-slug (lowercase, matches /tasks/:status) -> API status value.
const STATUS_QUERY_VALUE = {
  active: 'ACTIVE',
  missed: 'MISSED',
  completed: 'COMPLETED',
  incomplete: 'INCOMPLETE',
  deleted: 'DELETED',
};

// Task-specific API methods — server/API.md is the source of truth for shapes.
export const tasksApi = {
  list: (routeStatus) => {
    const query = routeStatus ? `?status=${STATUS_QUERY_VALUE[routeStatus] ?? routeStatus}` : '';
    return apiClient.get(`/tasks${query}`);
  },
  get: (id) => apiClient.get(`/tasks/${id}`),
  create: (body) => apiClient.post('/tasks', body),
  patch: (id, body) => apiClient.patch(`/tasks/${id}`, body),
  complete: (id) => apiClient.post(`/tasks/${id}/complete`),
  resolveMissed: (id, body) => apiClient.post(`/tasks/${id}/resolve-missed`, body),
  remove: (id, reason) => apiClient.delete(`/tasks/${id}`, { reason }),
};

// Push subscription API methods (Phase 18) — server/API.md is the source of truth for shapes.
export const pushApi = {
  getVapidPublicKey: () => apiClient.get('/push/vapid-public-key'),
  subscribe: (subscription) => apiClient.post('/push/subscribe', subscription),
  unsubscribe: (endpoint) => apiClient.delete('/push/subscribe', { endpoint }),
};

// In-app notification feed API methods (Phase 18).
export const notificationsApi = {
  list: ({ unreadOnly } = {}) => apiClient.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
};

// Work session (time tracking) API methods (Phase 19) — server/API.md is
// the source of truth for shapes. `list` returns the full chronological
// segment history; the frontend derives total/running/paused state from it
// client-side (see hooks/useWorkSession.js) rather than also calling the
// separate summary endpoint.
export const sessionsApi = {
  start: (taskId) => apiClient.post(`/tasks/${taskId}/sessions/start`),
  pause: (taskId) => apiClient.post(`/tasks/${taskId}/sessions/pause`),
  resume: (taskId) => apiClient.post(`/tasks/${taskId}/sessions/resume`),
  stop: (taskId) => apiClient.post(`/tasks/${taskId}/sessions/stop`),
  list: (taskId) => apiClient.get(`/tasks/${taskId}/sessions`),
};
