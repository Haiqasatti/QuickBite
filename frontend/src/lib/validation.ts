import type { ApiError } from "./api";

export type FormErrors = Record<string, string | undefined>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}

export function mapFieldErrors(error: ApiError): FormErrors {
  const result: FormErrors = {};
  for (const item of error.fieldErrors) {
    if (result[item.field] === undefined) result[item.field] = item.message;
  }
  return result;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidImageSource(value: string): boolean {
  return (
    isValidHttpUrl(value) ||
    (["/images/", "/uploads/images/"].some((prefix) => value.startsWith(prefix)) &&
      !value.includes("..") &&
      !value.includes("\\") &&
      !/[?#]/.test(value))
  );
}

export function validateLogin(values: { email: string; password: string }): FormErrors {
  const errors: FormErrors = {};
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length === 0) errors.password = "Enter your password.";
  return errors;
}

export function validateRegister(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
}): FormErrors {
  const errors: FormErrors = {};
  const name = values.name.trim();
  if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  else if (name.length > 80) errors.name = "Name must be at most 80 characters.";
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (values.password.length > 72) errors.password = "Password must be at most 72 characters.";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match.";
  if (values.address.trim().length > 250) errors.address = "Address must be at most 250 characters.";
  return errors;
}