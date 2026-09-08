import axios from 'axios';

// 后端 API 根路径，可通过环境变量 VITE_API_BASE_URL 配置，默认指向本地 8080
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入 JWT Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理认证过期
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 触发自定义事件通知应用登出
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials) => {
    const res = await client.post('/api/auth/public/login', credentials);
    return res.data; // { token: "..." }
  },
  register: async (userData) => {
    const res = await client.post('/api/auth/public/register', userData);
    return res.data;
  },
};

export const urlApi = {
  createShortUrl: async (originalUrl) => {
    const res = await client.post('/api/urls/shorten', { originalUrl });
    return res.data;
  },
  getMyUrls: async () => {
    const res = await client.get('/api/urls/myurls');
    return res.data;
  },
  getUrlAnalytics: async (shortUrl, startDate, endDate) => {
    const res = await client.get(`/api/urls/analytics/${shortUrl}`, {
      params: { startDate, endDate },
    });
    return res.data;
  },
  getTotalClicks: async (startDate, endDate) => {
    const res = await client.get('/api/urls/totalClicks', {
      params: { startDate, endDate },
    });
    return res.data;
  },
};

export default client;
export { API_BASE_URL };
