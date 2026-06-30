export interface IReview {
  _id: string;
  comment: string;
  rating: number;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  productId: {
    _id: string;
    name: string;
    images: { secure_url: string }[];
  };
  createdAt: string;
}
