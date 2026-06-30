import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string; // Outerwear, Dresses, Knitwear, Tailoring, Accessories, Bespoke
  price: number;
  sizes: string[];
  colors: { name: string; value: string }[];
  images: string[];
  fabric: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minSpend?: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

// Initial Mock Products matching Stitch AI screens
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Obsidian Silk Slip",
    description: "Elegant, flowing silhouette tailored from 100% Mulberry Silk. Features a dramatic low drape design at the back.",
    category: "Dresses",
    price: 1250,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Black", value: "#000000" },
      { name: "Navy", value: "#1e3a8a" }
    ],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAsqVZ5oMveVOTtLbK_i5qLq5gDtfHGnNbRH4NdlHA-Q9EPz4fQwtNnj09QPocZExiUZQZEq8KuhSMD7Ri_ZuqeZKqL-VqoDmWqmXwKRrIegiCMj24CYs6lS4zGl8VkODAWsE9dMflBB4vyCS_psrYfTF5n3uajhxQlTCwNzTJcX4HAhTdnwuDVUDV_4fzO1zIlrl0iNkhSYj76UxEtfPvaz_EW3NGD5mih_l1wZbEC6YUlsdvP_V0tIHN48f39IyO2eY652LuUJBM",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjuxFzESyuri35BwaAzIR7388ylaZkxk6uNv_vSMnkJNSsPwbTAH-wjI7duC8U8r1g7AZphVwnJV7nP42sE9_sJ6cSkAOo63r4FBwyuQ9vaYRBKdFOkKfSf10RJMBzmHy7FEXrUENJnXohrX_E4pud3TOPqPRf6tSCPbexsczE8sWqQ0thAvsuWWkyETIGR_eq6OdsNN6BH5W_WQafQ4Vu7NFRTN1gRiAntIxww1m_ph6jsteo7MymYc9q4kwp-Avolmbktg8iWiA"
    ],
    fabric: "100% Mulberry Silk",
    rating: 4.8,
    reviewsCount: 18,
    stock: 24,
    isBestseller: true
  },
  {
    id: "prod-2",
    name: "Ivory Column Dress",
    description: "Impeccably structured midi column dress with a sharp profile. Perfect for contemporary gallery styling.",
    category: "Dresses",
    price: 1890,
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Ivory", value: "#ffffff" },
      { name: "Cream", value: "#fdf6e2" }
    ],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAw7zOE6SWF8zBv7K-kHKVzT_zlbeq8IjSLGWbJgXsCSSmJWLAiNI5OSFq_Dv3LzE4b3M7c-tOSa83gHnpSnGiaPxp2VonUWpegRlEQgfARZGjyje_Wa5-Gbx8MNL86kPzLN7QGlBAgIa1jbKG72_9sGaDmoMymlIHjelTwd32xmYQdKWris6iaiONzFwpicEslK8cbJHBDSuciecxwh-iDF-ZlUmKDeLc0IlTu-wLxXO-IPA9jIKQNUPV_enVRHSUv-waGUkZVf1o",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhO2XOCo3PKSZyz5-xxBI0_-CdfHRPx5tshwWkkLMRGxLk908CXQJLsjkJtOd1NcSVOAPzRmL_EGcFFuPkI0Uppl4AvH14XydCby5QlBCTxEgHdjbeD5cIkKhdrYwmGJSlB8sJOhF1Uenk3CqNdjFJcpom6ko_BhSCsSmcJn6c0BAjm0r9Vxpv2867OZTVwDFuScB12hPXU4vzp9CO4mn-LL6L7qvBaHwZYXD1USl9V-GbO79EuvfJ0Yxym42l1CEacUwMfR3fyXM"
    ],
    fabric: "Structured Crepe Blend",
    rating: 4.9,
    reviewsCount: 12,
    stock: 15,
    isNew: true
  },
  {
    id: "prod-3",
    name: "Charcoal Overcoat",
    description: "Stark, directional tailored coat with sharp lapels and structural integrity. A heavyweight statement piece.",
    category: "Outerwear",
    price: 2400,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Charcoal", value: "#4b5563" },
      { name: "Black", value: "#000000" }
    ],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAc0R1_pD1ImNtYTLbTr86HhiXYt1QzfdCznCVtxzJ1FfnFQqsRK3eGJu1aBAwVwS6x5dqQMIHNiR7BAhjDsfqmoP9B0prG871faw2GAlE7ESAQZadQUyN02yOc5gZdfQg3FWjvST4gj7e4MpkWV71e_2bj3fyurqvDH-GHyw2MwHpZD2KqoVRmHk0xx7Kk0TpuJwp1i19pWc-7berZaP0J2oxaeUV36X_Bes4o85WGceRJ47TU2eP5wGdgQG_35Lmt5D8ZA0HxE0M",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjsqtnaZNVqHr--F2uMzv7wP-JzqkXpAqxJtbqJCSa8Q3hFMomEqKmwxCWqA2NSqN5b4MD1ObjBr5QarCz5FRWi9T5Ot-J-M_l_KvH-Xdyu4wOGHxSbF9AACc6GNwudNGwCuDMXCYCNaLm2ac_SQ3w5wINXy9oZIJwrWo_K5DxGbHOr61rdj6mHgv_vNuU6d7TJDYwTctnlopeCIKdmFoZyvnAqJbUOsbIMKRfvgsvb_MrtFNzuC__cgNOE5CKSh8elufl7MAH-F0"
    ],
    fabric: "Virgin Wool & Cashmere",
    rating: 5.0,
    reviewsCount: 31,
    stock: 8,
    isBestseller: true
  },
  {
    id: "prod-4",
    name: "Alabaster Cashmere Sweater",
    description: "Superfine Italian cashmere crewneck knit in an airy, minimalist style. Wonderfully warm yet lightweight.",
    category: "Knitwear",
    price: 950,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Alabaster", value: "#f3f4f6" },
      { name: "Beige", value: "#d1fae5" }
    ],
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiZmkEPJh6ojlJTet-wO-nLVtxkS37wN3AlQOtPc1u5BUWVVkd3M-Ww1FFSnUPfwPp_WXOzO_UZIdarI6a9dq9vFzEFZxcNQk5QbW05eXdXxuCrSKeLg66_726FI8oMvuzuUWlyC5Q67Fs0HO9sBgurAIUUUyXbeTnlxZSe3BoSw1C7dpJkHTvKiOqN4MzEp6x8HW9xE7DRL-WzJzdos5b6lKNlQZ1zq73T9c8AcT-VvJ9FtaAjGxDO1IJAo_ivk7dFeF1mUGEXqk",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCX_uB51ssww6bjEb2ZNPZz28XToC8mAspdUGgFJo44puujy5kYrj09lsVkiz9ysNATniME_zOBQHnYV4Zsmhroudt7ZMK5HVU8qL1cHxXc7FVeb63iAvRiX9YTEjDWya3zA7oKEwGTh8NkmDATewus55KiP4EfgU_BMqPnvgmYX7-3gg9ptB2i5rVsXtHIbtF0mHz6ZgZmX1kGCKKnbaYWD7LiYFbZeADN1Qb7OQXJw63jiLUNs0Qp3g"
    ],
    fabric: "100% Italian Cashmere",
    rating: 4.7,
    reviewsCount: 14,
    stock: 45,
    isNew: false
  }
];

const INITIAL_COUPONS: Coupon[] = [
  { code: "AURORA10", discountType: "percentage", value: 10, active: true },
  { code: "LUXURY50", discountType: "fixed", value: 50, minSpend: 500, active: true }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "AUR-9081",
    customerName: "Audrey Hepburn",
    customerEmail: "audrey@classic.com",
    shippingAddress: {
      street: "5th Avenue 722",
      city: "New York",
      zip: "10022",
      country: "United States"
    },
    items: [
      {
        productId: "prod-1",
        name: "Obsidian Silk Slip",
        price: 1250,
        quantity: 1,
        size: "S",
        color: "Black",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsqVZ5oMveVOTtLbK_i5qLq5gDtfHGnNbRH4NdlHA-Q9EPz4fQwtNnj09QPocZExiUZQZEq8KuhSMD7Ri_ZuqeZKqL-VqoDmWqmXwKRrIegiCMj24CYs6lS4zGl8VkODAWsE9dMflBB4vyCS_psrYfTF5n3uajhxQlTCwNzTJcX4HAhTdnwuDVUDV_4fzO1zIlrl0iNkhSYj76UxEtfPvaz_EW3NGD5mih_l1wZbEC6YUlsdvP_V0tIHN48f39IyO2eY652LuUJBM"
      }
    ],
    total: 1250,
    status: "Processing",
    date: "2026-06-10T14:30:00Z"
  },
  {
    id: "AUR-8924",
    customerName: "Charles Dupont",
    customerEmail: "charles.dupont@paris.fr",
    shippingAddress: {
      street: "Rue de Rivoli 45",
      city: "Paris",
      zip: "75001",
      country: "France"
    },
    items: [
      {
        productId: "prod-3",
        name: "Charcoal Overcoat",
        price: 2400,
        quantity: 1,
        size: "L",
        color: "Charcoal",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAc0R1_pD1ImNtYTLbTr86HhiXYt1QzfdCznCVtxzJ1FfnFQqsRK3eGJu1aBAwVwS6x5dqQMIHNiR7BAhjDsfqmoP9B0prG871faw2GAlE7ESAQZadQUyN02yOc5gZdfQg3FWjvST4gj7e4MpkWV71e_2bj3fyurqvDH-GHyw2MwHpZD2KqoVRmHk0xx7Kk0TpuJwp1i19pWc-7berZaP0J2oxaeUV36X_Bes4o85WGceRJ47TU2eP5wGdgQG_35Lmt5D8ZA0HxE0M"
      }
    ],
    total: 2400,
    status: "Delivered",
    date: "2026-06-08T09:15:00Z",
    trackingNumber: "TRK-98124971",
    carrier: "DHL Express"
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    productId: "prod-1",
    productName: "Obsidian Silk Slip",
    customerName: "Helena R.",
    rating: 5,
    comment: "The cut of this silk slip is absolute perfection. The fabric has a gorgeous weight to it and the back drape is breathtaking.",
    date: "2026-06-05",
    approved: true
  },
  {
    id: "rev-2",
    productId: "prod-2",
    productName: "Ivory Column Dress",
    customerName: "Sophia K.",
    rating: 4,
    comment: "Very elegant and holds its structure beautifully. Sizing runs slightly tight.",
    date: "2026-06-09",
    approved: false
  }
];

export interface Customer {
  email: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  membership: 'VIP' | 'Member' | 'New';
  location: string;
  notes?: string;
}

interface ECommerceState {
  // Products Store
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Cart Store
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;

  // Wishlist Store
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;

  // Orders Store
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date'>) => string;
  updateOrderStatus: (id: string, status: Order['status'], carrier?: string, trackingNumber?: string) => void;

  // Coupons Store
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (code: string) => void;

  // Reviews Store
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date' | 'approved'>) => void;
  approveReview: (id: string) => void;
  deleteReview: (id: string) => void;

  // Customers Store
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
}

export const useStore = create<ECommerceState>()(
  persist(
    (set) => ({
      products: INITIAL_PRODUCTS,
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updated) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      cart: [],
      addToCart: (newItem) =>
        set((state) => {
          const quantity = newItem.quantity ?? 1;
          const existingIndex = state.cart.findIndex(
            (item) =>
              item.product.id === newItem.product.id &&
              item.size === newItem.size &&
              item.color === newItem.color
          );

          if (existingIndex > -1) {
            const updatedCart = [...state.cart];
            updatedCart[existingIndex].quantity += quantity;
            return { cart: updatedCart };
          }

          return {
            cart: [
              ...state.cart,
              {
                product: newItem.product,
                size: newItem.size,
                color: newItem.color,
                quantity,
              },
            ],
          };
        }),
      removeFromCart: (index) =>
        set((state) => ({
          cart: state.cart.filter((_, i) => i !== index),
        })),
      updateCartQuantity: (index, quantity) =>
        set((state) => {
          const updatedCart = [...state.cart];
          if (quantity <= 0) {
            return { cart: state.cart.filter((_, i) => i !== index) };
          }
          updatedCart[index].quantity = quantity;
          return { cart: updatedCart };
        }),
      clearCart: () => set({ cart: [] }),

      wishlist: [],
      toggleWishlist: (productId) =>
        set((state) => {
          const exists = state.wishlist.includes(productId);
          return {
            wishlist: exists
              ? state.wishlist.filter((id) => id !== productId)
              : [...state.wishlist, productId],
          };
        }),

      orders: INITIAL_ORDERS,
      addOrder: (orderData) => {
        const orderId = `AUR-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder: Order = {
          ...orderData,
          id: orderId,
          date: new Date().toISOString(),
        };
        set((state) => ({ orders: [newOrder, ...state.orders] }));
        return orderId;
      },
      updateOrderStatus: (id, status, carrier, trackingNumber) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status, carrier: carrier || o.carrier, trackingNumber: trackingNumber || o.trackingNumber } : o
          ),
        })),

      coupons: INITIAL_COUPONS,
      addCoupon: (coupon) => set((state) => ({ coupons: [...state.coupons, coupon] })),
      deleteCoupon: (code) =>
        set((state) => ({ coupons: state.coupons.filter((c) => c.code !== code) })),

      reviews: INITIAL_REVIEWS,
      addReview: (rev) => {
        const newReview: Review = {
          ...rev,
          id: `rev-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          approved: false, // Reviews start as pending approval by default
        };
        set((state) => ({ reviews: [newReview, ...state.reviews] }));
      },
      approveReview: (id) =>
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === id ? { ...r, approved: true } : r)),
        })),
      deleteReview: (id) =>
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== id),
        })),

      customers: [
        {
          email: "e.vance@example.com",
          name: "Eleanor Vance",
          orderCount: 12,
          totalSpent: 24500,
          lastOrderDate: "2026-06-11T09:12:00Z",
          membership: "VIP",
          location: "New York, NY"
        },
        {
          email: "isabella.r@example.com",
          name: "Isabella Ross",
          orderCount: 4,
          totalSpent: 8240,
          lastOrderDate: "2026-06-08T11:15:00Z",
          membership: "Member",
          location: "London, UK"
        },
        {
          email: "m.sterling@example.com",
          name: "Marcus Sterling",
          orderCount: 1,
          totalSpent: 1200,
          lastOrderDate: "2026-06-07T16:45:00Z",
          membership: "New",
          location: "Paris, FR"
        }
      ],
      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
    }),
    {
      name: 'aurora-luxury-store',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        products: state.products,
        orders: state.orders,
        coupons: state.coupons,
        reviews: state.reviews,
        customers: state.customers,
      }),
    }
  )
);
