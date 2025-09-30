import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Farm API
export const farmApi = {
  getSummary: (farmId: string) =>
    api.get(`/farms/${farmId}/summary`).then((res) => res.data),

  getLatestTelemetry: (farmId: string) =>
    api.get(`/farms/${farmId}/latest-telemetry`).then((res) => res.data),

  getWeather: (farmId: string) =>
    api.get(`/farms/${farmId}/weather`).then((res) => res.data),

  getInventorySummary: (farmId: string) =>
    api.get(`/farms/${farmId}/inventory/summary`).then((res) => res.data),

  getTasksSummary: (farmId: string) =>
    api.get(`/farms/${farmId}/tasks/summary`).then((res) => res.data),

  getAlertsSummary: (farmId: string) =>
    api.get(`/farms/${farmId}/alerts/summary`).then((res) => res.data),

  getPolyhouses: (farmId: string) =>
    api.get(`/farms/${farmId}/polyhouses`).then((res) => res.data),

  getReservoirs: (farmId: string) =>
    api.get(`/farms/${farmId}/reservoirs`).then((res) => res.data),

  getZones: (farmId: string) =>
    api.get(`/farms/${farmId}/zones`).then((res) => res.data),

  getZoneDetail: (farmId: string, zoneId: string) =>
    api.get(`/farms/${farmId}/zones/${zoneId}`).then((res) => res.data),

  getUsers: (farmId: string) =>
    api.get(`/farms/${farmId}/users`).then((res) => res.data),
};

// Commands API
export const commandApi = {
  create: (data: {
    farmId: string;
    targetType: string;
    targetId: string;
    action: string;
    parameters?: any;
    requestedBy?: string;
  }) => api.post('/commands', data).then((res) => res.data),

  getAll: (farmId?: string) =>
    api.get('/commands', { params: { farmId } }).then((res) => res.data),
};

export default api;