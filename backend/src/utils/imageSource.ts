export function isValidImageSource(value: string): boolean {
  if (value.startsWith("/images/") || value.startsWith("/uploads/images/")) {
    return !value.includes("..") && !value.includes("\\") && !/[?#]/.test(value);
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}