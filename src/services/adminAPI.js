import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://ankit-production-f3d4.up.railway.app/api';

const getAdminToken = () => localStorage.getItem('adminToken');

const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: { 'Content-Type': 'application/json' }
});

adminAPI.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchStats = () => adminAPI.get('/stats');
export const fetchUsers = (page = 1) => adminAPI.get(`/users?page=${page}`);
export const fetchRides = (page = 1) => adminAPI.get(`/rides?page=${page}`);
export const fetchMatches = (page = 1) => adminAPI.get(`/matches?page=${page}`);
export const fetchAdmins = () => adminAPI.get('/admins');
export const createAdmin = (data) => adminAPI.post('/create-admin', data);
export const deactivateAdmin = (id) => adminAPI.delete(`/${id}`);
export const fetchChartData = () => adminAPI.get('/chart-data');

export default adminAPI;
