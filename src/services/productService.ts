import axiosInstance from '../api/axios';
import { endpoints } from '../api/endpoints';
import { Product, FacetedResponse } from '../types/product';

export const productService = {
  /**
   * Fetch products with optional filtering and sorting
   */
  getProducts: async (params?: { 
    categoryId?: string; 
    brandId?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    sort?: string;
    search?: string;
  }): Promise<Product[]> => {
    const response = await axiosInstance.get<any>(endpoints.products.list, { params });
    const data = response.data;

    // Standard patterns: [items], { data: [items] }, { data: { products: [items] } }
    if (Array.isArray(data)) return data;
    if (data?.data) {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.data.products)) return data.data.products;
    }
    return [];
  },

  /**
   * Fetch a single product by its ID
   */
  getProductById: async (id: string): Promise<Product> => {
    const response = await axiosInstance.get<any>(endpoints.products.details(id));
    const data = response.data;
    
    // Support: { data: { product: ... } }, { data: ... }, or direct response
    return data?.data?.product || data?.data || data;
  },

  /**
   * Fetch related products by category ID
   */
  getRelatedProducts: async (categoryId?: string): Promise<Product[]> => {
    if (!categoryId) return [];
    return productService.getProducts({ categoryId });
  },

  /**
   * Fetch products with dynamic faceted filters (server-side filtering)
   */
  getFacetedProducts: async (params: Record<string, string>): Promise<FacetedResponse> => {
    const response = await axiosInstance.get<any>(endpoints.products.faceted, { params });
    const data = response.data?.data || response.data;
    return {
      products: data.products || [],
      pagination: data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 20, hasNextPage: false, hasPrevPage: false },
      filters: data.filters || { colors: [], sizes: [], priceRange: { min: 0, max: 10000 }, brands: [], attributes: [] },
    };
  },

  // Admin Methods
  createProduct: async (formData: FormData): Promise<Product> => {
    const response = await axiosInstance.post(endpoints.products.list, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data?.product || response.data.data;
  },

  updateProduct: async (id: string, formData: FormData): Promise<Product> => {
    const response = await axiosInstance.put(endpoints.products.details(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data?.product || response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await axiosInstance.delete(endpoints.products.details(id));
  },
};
