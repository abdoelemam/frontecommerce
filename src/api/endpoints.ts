export const endpoints = {
  auth: {
    login: '/users/signin',
    register: '/users/signup',
    verifyEmail: '/users/verify-email',
    resendCode: '/users/resend-code',
    forgotPassword: '/users/forgot-password',
    resetPassword: '/users/reset-password',
    refreshToken: '/users/refresh-token',
  },
  users: {
    profile: '/users/profile',
    changePassword: '/users/change-password',
    admin: {
      list: '/users',
      block: (id: string) => `/users/block/${id}`,
    },
  },
  products: {
    list: '/products',
    faceted: '/products/faceted',
    details: (id: string) => `/products/${id}`,
  },
  cart: {
    base: '/cart',
    get: '/cart',
    add: '/cart',
    update: (id: string) => `/cart/${id}`,
    remove: (id: string) => `/cart/${id}`,
  },
  orders: {
    create: '/orders',
    list: '/orders',
    myOrders: '/orders/my-orders',
    cancel: (id: string) => `/orders/${id}/cancel`,
    details: (id: string) => `/orders/${id}`,
    admin: {
      list: '/orders',
      updateStatus: (id: string) => `/orders/${id}/status`,
    }
  },
  reviews: {
    product: (productId: string) => `/reviews/${productId}`,
    add: (productId: string) => `/reviews/${productId}`,
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`,
    admin: {
      list: '/reviews',
    }
  },
  coupons: {
    apply: '/coupons/apply',
    remove: '/coupons/remove',
    list: '/coupons',
    create: '/coupons',
    update: (id: string) => `/coupons/${id}`,
    delete: (id: string) => `/coupons/${id}`,
  },
  categories: {
    list: '/categories',
    details: (id: string) => `/categories/${id}`,
    subcategories: (id: string) => `/categories/${id}/subcategories`,
  },
  brands: {
    list: '/brands',
    details: (id: string) => `/brands/${id}`,
  },
  wishlist: {
    get: '/wishlist',
    toggle: (id: string) => `/wishlist/${id}`,
    remove: (id: string) => `/wishlist/${id}`,
    clear: '/wishlist',
  },
};
