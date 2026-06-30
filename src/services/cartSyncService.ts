import api from '../api/axios';
import { endpoints } from '../api/endpoints';
import { CartItem } from '../types/cart';
import { productService } from './productService';

export const cartSyncService = {
  /**
   * Fully syncs the frontend Zustand cart with the backend database.
   * This is explicitly required because backend operations (Coupons, Orders) securely act strictly native directly on the DB Cart securely.
   */
  syncCartBeforeCheckout: async (cartItems: CartItem[]): Promise<void> => {
    // 1. Clear existing cart strictly to avoid duplicate accumulation errors securely
    try {
      await api.delete(endpoints.cart.base);
    } catch (e) {
      // It might throw 404 if the cart doesn't exist, which is fine
    }

    if (cartItems.length === 0) return;

    // 2. Add each item distinctly natively mapping parameters exactly
    await Promise.all(
      cartItems.map(async (item) => {
        let variantId = item.variant?._id;

        // Dynamic fallback: if variantId is missing, retrieve the product to get its default variant ID
        if (!variantId) {
          try {
            const product = await productService.getProductById(item.productId);
            if (product?.variants && product.variants.length > 0) {
              variantId = product.variants[0]._id;
            }
          } catch (e) {
            console.error("Failed to fetch fallback variant for product:", item.productId, e);
          }
        }

        if (!variantId) {
          throw new Error(`Variant is missing for product: ${item.name}`);
        }

        return api.post(endpoints.cart.base, {
          productId: item.productId,
          variantId: variantId,
          quantity: item.quantity,
        });
      })
    );
  },
};
