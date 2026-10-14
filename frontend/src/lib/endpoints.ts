import { request } from "./api";
import type {
  AuthResult,
  Category,
  CategoryInput,
  CreateOrderInput,
  Food,
  FoodInput,
  LoginInput,
  Order,
  OrderStatus,
  RegisterInput,
  User,
} from "../types";

export const authApi = {
  register: (input: RegisterInput) =>
    request<AuthResult>("/auth/register", { method: "POST", body: input }),
  login: (input: LoginInput) => request<AuthResult>("/auth/login", { method: "POST", body: input }),
  me: () => request<{ user: User }>("/auth/me", { auth: true }),
};

export const catalogApi = {
  categories: () => request<{ categories: Category[] }>("/categories"),
  foods: () => request<{ foods: Food[] }>("/foods"),
  allCategories: () => request<{ categories: Category[] }>("/categories/admin/all", { auth: true }),
  allFoods: () => request<{ foods: Food[] }>("/foods/admin/all", { auth: true }),

  createCategory: (input: CategoryInput) =>
    request<{ category: Category }>("/categories", { method: "POST", body: input, auth: true }),
  updateCategory: (id: string, input: Partial<CategoryInput>) =>
    request<{ category: Category }>(`/categories/${id}`, { method: "PUT", body: input, auth: true }),
  deleteCategory: (id: string) =>
    request<{ id: string }>(`/categories/${id}`, { method: "DELETE", auth: true }),

  createFood: (input: FoodInput) =>
    request<{ food: Food }>("/foods", { method: "POST", body: input, auth: true }),
  updateFood: (id: string, input: Partial<FoodInput>) =>
    request<{ food: Food }>(`/foods/${id}`, { method: "PUT", body: input, auth: true }),
  deleteFood: (id: string) =>
    request<{ id: string }>(`/foods/${id}`, { method: "DELETE", auth: true }),
};

export const orderApi = {
  create: (input: CreateOrderInput) =>
    request<{ order: Order }>("/orders", { method: "POST", body: input, auth: true }),
  mine: () => request<{ orders: Order[] }>("/orders/my", { auth: true }),
  all: () => request<{ orders: Order[] }>("/orders", { auth: true }),
  updateStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
};

export const imageApi = {
  upload: (file: File) => {
    const body = new FormData();
    body.append("image", file);
    return request<{ image: { path: string } }>("/images/upload", { method: "POST", body, auth: true });
  },
  importFromUrl: (url: string) =>
    request<{ image: { path: string } }>("/images/import", { method: "POST", body: { url }, auth: true }),
};