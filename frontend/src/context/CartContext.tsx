import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_ITEM_QUANTITY } from "../lib/constants";
import { fromCents, lineCents } from "../lib/format";
import { isRecord } from "../lib/guards";
import type { Food } from "../types";

export interface CartLine {
  foodId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  quantityOf: (foodId: string) => number;
  add: (food: Food) => void;
  setQuantity: (foodId: string, quantity: number) => void;
  remove: (foodId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "quickbite.cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry: unknown): CartLine[] => {
      if (!isRecord(entry)) return [];
      const { foodId, name, price, image, quantity } = entry;
      if (
        typeof foodId !== "string" ||
        typeof name !== "string" ||
        typeof price !== "number" ||
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return [];
      }
      return [
        {
          foodId,
          name,
          price,
          image: typeof image === "string" ? image : undefined,
          quantity: Math.min(quantity, MAX_ITEM_QUANTITY),
        },
      ];
    });
  } catch {
    return [];
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable: the cart stays in memory only */
    }
  }, [lines]);

  const add = useCallback((food: Food) => {
    if (!food.isAvailable) return;
    setLines((previous) => {
      const existing = previous.find((line) => line.foodId === food.id);
      if (existing) {
        return previous.map((line) =>
          line.foodId === food.id
            ? { ...line, quantity: Math.min(line.quantity + 1, MAX_ITEM_QUANTITY) }
            : line
        );
      }
      return [
        ...previous,
        { foodId: food.id, name: food.name, price: food.price, image: food.image, quantity: 1 },
      ];
    });
  }, []);

  const setQuantity = useCallback((foodId: string, quantity: number) => {
    setLines((previous) =>
      quantity <= 0
        ? previous.filter((line) => line.foodId !== foodId)
        : previous.map((line) =>
            line.foodId === foodId
              ? { ...line, quantity: Math.min(Math.floor(quantity), MAX_ITEM_QUANTITY) }
              : line
          )
    );
  }, []);

  const remove = useCallback((foodId: string) => {
    setLines((previous) => previous.filter((line) => line.foodId !== foodId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = fromCents(
      lines.reduce((sum, line) => sum + lineCents(line.price, line.quantity), 0)
    );
    return {
      lines,
      count,
      subtotal,
      quantityOf: (foodId) => lines.find((line) => line.foodId === foodId)?.quantity ?? 0,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}