import { create } from 'zustand';
import Cookies from 'js-cookie';
import { IUser } from '../types/user';

interface AuthState {
  token: string | null;           // Access Token
  refreshToken: string | null;    // Refresh Token
  user: IUser | null;
  setAuth: (token: string, refreshToken: string, user: IUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get('token') || null,
  refreshToken: Cookies.get('refreshToken') || null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,

  setAuth: (token, refreshToken, user) => {
    Cookies.set('token', token, { expires: 1 });
    Cookies.set('refreshToken', refreshToken, { expires: 7 });
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, refreshToken, user });
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    localStorage.removeItem('user');
    set({ token: null, refreshToken: null, user: null });
  },
}));
