import axiosInstance from '../api/axios';
import { endpoints } from '../api/endpoints';

export const authService = {
  login: async (credentials: any) => {
    const response = await axiosInstance.post(endpoints.auth.login, credentials);
    return response.data;
  },
  register: async (userData: any) => {
    const response = await axiosInstance.post(endpoints.auth.register, userData);
    return response.data;
  },
  verifyEmail: async (data: { email: string; otp: string }) => {
    const response = await axiosInstance.post(endpoints.auth.verifyEmail, data);
    return response.data;
  },
  resendCode: async (data: { email: string }) => {
    const response = await axiosInstance.post(endpoints.auth.resendCode, data);
    return response.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const response = await axiosInstance.post(endpoints.auth.forgotPassword, data);
    return response.data;
  },
  resetPassword: async (data: Partial<{ email: string; otp: string; newPassword: string }>) => {
    const response = await axiosInstance.patch(endpoints.auth.resetPassword, data);
    return response.data;
  },
};
