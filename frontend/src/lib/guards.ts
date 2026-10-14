export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Where to go after login: the protected page the user originally wanted, else home. */
export function getRedirectPath(state: unknown): string {
  if (isRecord(state) && isRecord(state.from) && typeof state.from.pathname === "string") {
    const { pathname } = state.from;
    if (pathname.startsWith("/") && !pathname.startsWith("//")) {
      return pathname;
    }
  }
  return "/";
}

export function getPlacedOrderId(state: unknown): string | null {
  return isRecord(state) && typeof state.placedOrderId === "string" ? state.placedOrderId : null;
}