import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types/cart';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  _hasHydrated: boolean;
  appliedCoupon: { code: string; discountAmount: number } | null;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  setAppliedCoupon: (coupon: { code: string; discountAmount: number } | null) => void;
  clearCart: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _hasHydrated: false,
      appliedCoupon: null,
      setIsOpen: (isOpen) => set({ isOpen }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      
      addItem: (newItem) => set((state) => {
        // Check if item exists (matching productId and variant)
        const existingItemIndex = state.items.findIndex(
           i => i.productId === newItem.productId && 
                i.variant?._id === newItem.variant?._id
        );

        if (existingItemIndex > -1) {
          // Increment quantity if already in cart
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity += newItem.quantity;
          return { items: newItems };
        } else {
          // Add new item
          return { items: [...state.items, newItem] };
        }
      }),

      removeItem: (productId, variantId) => set((state) => ({
        items: state.items.filter(i => 
          !(i.productId === productId && i.variant?._id === variantId)
        )
      })),

      updateQuantity: (productId, quantity, variantId) => set((state) => ({
        items: state.items.map(i => {
           if (i.productId === productId && i.variant?._id === variantId) {
             return { ...i, quantity: Math.max(1, quantity) }; // prevent < 1
           }
           return i;
         })
      })),

      clearCart: () => set({ items: [], appliedCoupon: null }),
    }),
    {
      name: 'ecommerce-cart-storage', // unique name for localStorage key
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
