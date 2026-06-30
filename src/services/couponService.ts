import api from '../api/axios';
import { endpoints } from '../api/endpoints';
import { Coupon } from '../types/coupon';

interface ApplyCouponResponse {
  data: {
    discount: number;
    discountType: 'percentage' | 'fixedAmount';
    totalAfterDiscount: number;
    couponCode: string;
  };
}

export const couponService = {
  applyCoupon: async (code: string): Promise<ApplyCouponResponse['data']> => {
    const { data } = await api.post<ApplyCouponResponse>(endpoints.coupons.apply, { code });
    return data.data;
  },

  removeCoupon: async (): Promise<void> => {
    await api.delete(endpoints.coupons.remove);
  },

  // Admin Methods
  getAllCoupons: async (): Promise<Coupon[]> => {
    const { data } = await api.get(endpoints.coupons.list);
    return data.data?.coupons || data.data || data;
  },

  createCoupon: async (payload: Partial<Coupon>): Promise<Coupon> => {
    const { data } = await api.post(endpoints.coupons.list, payload);
    return data.data?.coupon || data.data;
  },

  updateCoupon: async (id: string, payload: Partial<Coupon>): Promise<Coupon> => {
    const { data } = await api.put(endpoints.coupons.update(id), payload);
    return data.data?.coupon || data.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(endpoints.coupons.delete(id));
  },
};
