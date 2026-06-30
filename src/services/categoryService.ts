import axiosInstance from '../api/axios';
import { endpoints } from '../api/endpoints';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: {
    secure_url: string;
    key: string;
  };
  parentId?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await axiosInstance.get<any>(endpoints.categories.list);
    const data = response.data;
    
    // Support: [items], { data: [items] }, { data: { categories: [items] } }
    if (Array.isArray(data)) return data;
    if (data?.data) {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.data.categories)) return data.data.categories;
    }
    return [];
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await axiosInstance.get<any>(endpoints.categories.details(id));
    const data = response.data;
    return data?.data?.category || data?.data || data;
  },
};
