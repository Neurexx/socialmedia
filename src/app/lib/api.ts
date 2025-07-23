import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (username: string, email: string, password: string) =>
    api.post('/auth/signup', { username, email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const postAPI = {
  create: (title: string, description: string) =>
    api.post('/posts', { title, description }),
  getTimeline: () => api.get('/posts/timeline'),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  followUser: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId: string) => api.delete(`/users/${userId}/follow`),
};