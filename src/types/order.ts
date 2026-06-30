import { Product } from "./product";

export enum OrderStatus {
  pending = "pending",
  processing = "processing",
  shipped = "shipped",
  delivered = "delivered",
  cancelled = "cancelled",
}

export enum PaymentMethod {
  cash = "cash",
  card = "card",
}

export interface IOrderItem {
  _id: string;
  productId: Product; // populated Product object
  variantId: string;
  quantity: number;
  price: number;
  finalPrice: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  items: IOrderItem[];
  totalPrice: number;
  shippingAddress: {
    street: string;
    city: string;
    phone: string;
  };
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  isPaid: boolean;
  paidAt?: string;
  couponId?: string;
  discount?: number;
  priceAfterDiscount?: number;
  cancelledAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}
