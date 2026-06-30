import api from "../api/axios";
import { endpoints } from "../api/endpoints";
import { IUser } from "../types/user";

export interface UsersResponse {
  message: string;
  data: {
    users: IUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

export const userService = {
  // Profile Methods
  getProfile: async () => {
    const { data } = await api.get(endpoints.users.profile);
    return data.data || data;
  },

  updateProfile: async (payload: { fname?: string; lname?: string; email?: string; phone?: string; gender?: string }) => {
    const { data } = await api.put(endpoints.users.profile, payload);
    return data;
  },

  changePassword: async (payload: any) => {
    const { data } = await api.patch(endpoints.users.changePassword, payload);
    return data;
  },

  // Admin Methods
  getAllUsers: async (page = 1, search = ""): Promise<UsersResponse> => {
    const { data } = await api.get<UsersResponse>(endpoints.users.admin.list, {
      params: { page, search, limit: 10 },
    });
    return data;
  },

  toggleBlockStatus: async (userId: string): Promise<any> => {
    const { data } = await api.patch(endpoints.users.admin.block(userId));
    return data;
  },
};
