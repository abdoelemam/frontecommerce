import axios from 'axios';
import Cookies from 'js-cookie';
import { endpoints } from './endpoints';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the failed request IS the refresh request
      if (originalRequest.url === endpoints.auth.refreshToken) {
        performLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');

      if (!refreshToken) {
        performLogout();
        isRefreshing = false;
        processQueue(error, null);
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${axiosInstance.defaults.baseURL}${endpoints.auth.refreshToken}`,
          { refreshToken }
        );

        const newAccessToken = data.data?.accessToken || data.accessToken;

        if (newAccessToken) {
          // Save the new access token
          Cookies.set('token', newAccessToken, { expires: 1 });

          // Update the authorization header
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);

          return axiosInstance(originalRequest);
        } else {
          performLogout();
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        performLogout();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function performLogout() {
  Cookies.remove('token');
  Cookies.remove('refreshToken');
  localStorage.removeItem('user');

  // Redirect to login if we're in the browser
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    // Don't redirect if already on auth pages
    if (!['/login', '/register', '/forgot-password', '/verifyemail'].includes(currentPath)) {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}

export default axiosInstance;
