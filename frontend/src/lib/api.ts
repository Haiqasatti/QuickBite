import type { FieldError } from "../types";
import { env } from "./env";
import { isRecord } from "./guards";

const TOKEN_KEY = "quickbite.token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: the session will last until the page is closed */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];

  constructor(message: string, status: number, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function parseFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((item): FieldError[] =>
    typeof item.field === "string" && typeof item.message === "string"
      ? [{ field: item.field, message: item.message }]
      : []
  );
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isFormData(body)) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData(body) ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401 && auth && unauthorizedHandler) {
      unauthorizedHandler();
    }
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status})`;
    const fieldErrors = isRecord(payload) ? parseFieldErrors(payload.errors) : [];
    throw new ApiError(message, response.status, fieldErrors);
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new ApiError("Unexpected response from the server.", response.status);
  }
  return payload.data as T;
}