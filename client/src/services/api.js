import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const api = {
  // Auth
  getMe: () => http.get('/auth/me').then((r) => r.data),
  demoLogin: () => http.post('/auth/demo').then((r) => r.data),
  logout: () => http.post('/auth/logout').then((r) => r.data),

  // Vocabulary
  getVocabulary: (level) => http.get(`/vocabulary/${level}`).then((r) => r.data),
  getAllVocabulary: () => http.get('/vocabulary/all').then((r) => r.data),
  getRandomWord: (level) =>
    http.get('/vocabulary/practice/random', { params: { level } }).then((r) => r.data),

  // Writing
  getWritingTopic: (level) =>
    http.get('/writing/topic', { params: { level } }).then((r) => r.data),
  analyzeWriting: (text) =>
    http.post('/writing/analyze', { text }).then((r) => r.data),

  // User progress (GitHub Gist)
  getProgress: () => http.get('/user/progress').then((r) => r.data),
  saveProgress: (progress) =>
    http.post('/user/progress', { progress }).then((r) => r.data),
  getUserProfile: () => http.get('/user/profile').then((r) => r.data),
};

export default api;
