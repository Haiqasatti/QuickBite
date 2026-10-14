export type UserRole = "CUSTOMER" | "ADMIN";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface FieldError {
  field: string;
  message: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Food {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  foodId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer?: { name: string; email: string };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  address?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface FoodInput {
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isAvailable?: boolean;
}

export interface CreateOrderInput {
  items: { foodId: string; quantity: number }[];
  deliveryAddress: string;
  paymentMethod: "COD";
}