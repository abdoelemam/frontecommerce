import api from '../api/axios';
import { endpoints } from '../api/endpoints';
import { Product } from '../types/product';

export interface WishlistResponse {
  message: string;
  data: {
    wishlist: Product[];
  };
}

export interface ToggleWishlistResponse {
  message: string;
  data: {
    action: 'added' | 'removed';
  };
}

export const wishlistService = {
  // Get all wishlist items
  getWishlist: async (): Promise<Product[]> => {
    const { data } = await api.get<WishlistResponse>(endpoints.wishlist.get);
    return data.data.wishlist || [];
  },

  // Toggle a product in the wishlist
  toggleWishlist: async (productId: string): Promise<{ action: 'added' | 'removed' }> => {
    const { data } = await api.patch<ToggleWishlistResponse>(endpoints.wishlist.toggle(productId));
    return data.data;
  },

  // Remove specific product from wishlist
  removeFromWishlist: async (productId: string): Promise<void> => {
    await api.delete(endpoints.wishlist.remove(productId));
  },

  // Clear all wishlist items
  clearWishlist: async (): Promise<void> => {
    await api.delete(endpoints.wishlist.clear);
  },
};
