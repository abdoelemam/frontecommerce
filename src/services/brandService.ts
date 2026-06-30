import axiosInstance from '../api/axios';
import { endpoints } from '../api/endpoints';

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  image?: {
    secure_url: string;
    key: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const brandService = {
  getBrands: async (): Promise<Brand[]> => {
    try {
      const response = await axiosInstance.get<any>(endpoints.brands.list);
      const data = response.data;
      
      // Support: [items], { data: [items] }, { data: { brands: [items] } }
      if (Array.isArray(data)) return data;
      if (data?.data) {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.data.brands)) return data.data.brands;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch brands, returning empty array", error);
      return [];
    }
  },
};
