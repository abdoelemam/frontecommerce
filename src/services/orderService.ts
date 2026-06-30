import api from '../api/axios';
import { endpoints } from '../api/endpoints';
import { IOrder } from '../types/order';

export interface MyOrdersResponse {
  message: string;
  data: {
    orders: IOrder[];
  };
}

export interface SingleOrderResponse {
  message: string;
  data: {
    order: IOrder;
  };
}

export interface CancelOrderResponse {
  message: string;
  data: {
    order: IOrder;
  };
}

export const orderService = {
  // Create an order
  createOrder: async (orderData: any) => {
    const { data } = await api.post(endpoints.orders.create, orderData);
    return data;
  },

  // Create Paymob checkout session
  createPaymobCheckoutSession: async (orderId: string): Promise<string> => {
    const { data } = await api.post(`/orders/${orderId}/checkout-session`);
    return data.data.sessionUrl;
  },

  // Fetch logged-in user's orders
  getMyOrders: async (): Promise<IOrder[]> => {
    const { data } = await api.get<MyOrdersResponse>(endpoints.orders.myOrders);
    return data.data.orders;
  },

  // Fetch single order details
  getOrderById: async (orderId: string): Promise<IOrder> => {
    const { data } = await api.get<SingleOrderResponse>(endpoints.orders.details(orderId));
    return data.data.order;
  },

  // Cancel a pending order
  cancelOrder: async (orderId: string): Promise<IOrder> => {
    const { data } = await api.patch<CancelOrderResponse>(endpoints.orders.cancel(orderId));
    return data.data.order;
  },

  // ========== Admin Routes ==========
  
  // Fetch all orders globally
  getAllOrdersAdmin: async (): Promise<IOrder[]> => {
    const { data } = await api.get<MyOrdersResponse>(endpoints.orders.admin.list);
    return data.data.orders;
  },

  // Update order status uniquely
  updateOrderStatusAdmin: async (orderId: string, status: string): Promise<IOrder> => {
    const { data } = await api.patch<SingleOrderResponse>(endpoints.orders.admin.updateStatus(orderId), { status });
    return data.data.order;
  },
};
