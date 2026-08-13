import axios from 'axios';

// 하드코딩 금지: 기본은 same-origin 상대경로(/api ...) → 개발은 Vite proxy가 백엔드로 전달,
// 배포 시 백엔드 절대주소가 다르면 VITE_API_BASE 로 지정.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
