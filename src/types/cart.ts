import { ProductVariant } from './product';

export interface CartItem {
  _id?: string; // ID assigned by backend if synced
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: ProductVariant | null;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}
