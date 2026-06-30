import api from "../api/axios";
import { endpoints } from "../api/endpoints";
import { IReview } from "../types/review";

export interface ReviewsResponse {
  message: string;
  data: {
    reviews: IReview[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

export const reviewService = {
  // Public/Product specific
  getProductReviews: async (productId: string): Promise<IReview[]> => {
    const { data } = await api.get(endpoints.reviews.product(productId));
    return data?.data?.reviews || data?.data || data || [];
  },

  addReview: async (productId: string, payload: { rating: number; comment: string }) => {
    const { data } = await api.post(endpoints.reviews.add(productId), payload);
    return data;
  },

  updateReview: async (reviewId: string, payload: { rating: number; comment: string }) => {
    const { data } = await api.put(endpoints.reviews.update(reviewId), payload);
    return data;
  },

  deleteReview: async (reviewId: string) => {
    const { data } = await api.delete(endpoints.reviews.delete(reviewId));
    return data;
  },

  // Admin Methods
  getAllReviewsAdmin: async (page = 1): Promise<ReviewsResponse> => {
    const { data } = await api.get<ReviewsResponse>(endpoints.reviews.admin.list, {
      params: { page, limit: 10 },
    });
    return data;
  },

  deleteReviewAdmin: async (reviewId: string): Promise<any> => {
    const { data } = await api.delete(endpoints.reviews.delete(reviewId));
    return data;
  },
};
