export interface IUser {
  _id: string;
  fname?: string;
  lname?: string;
  username?: string;
  email: string;
  role: string;
  phone?: string;
  gender?: string;
  isBlocked?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

