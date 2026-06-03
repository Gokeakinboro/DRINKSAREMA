"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "./api";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  loyaltyPoints: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  isCase: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    unitPrice: number;
    casePrice?: number;
    caseQty?: number;
    images: string[];
    stockQuantity: number;
  };
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  ageVerified: boolean;
  setUser: (user: User | null) => void;
  setAgeVerified: (v: boolean) => void;
  logout: () => void;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, isCase?: boolean) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  get count(): number;
  get subtotal(): number;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      ageVerified: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAgeVerified: (v) => set({ ageVerified: v }),
      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "da-auth", partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated, ageVerified: s.ageVerified }) }
  )
);

function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("sessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }
  return id;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isLoading: false,
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      getSessionId();
      const { data } = await api.get("/cart");
      set({ items: data.items });
    } finally {
      set({ isLoading: false });
    }
  },
  addItem: async (productId, quantity, isCase = false) => {
    getSessionId();
    await api.post("/cart", { productId, quantity, isCase });
    await get().fetchCart();
  },
  updateItem: async (id, quantity) => {
    await api.put(`/cart/${id}`, { quantity });
    await get().fetchCart();
  },
  removeItem: async (id) => {
    await api.delete(`/cart/${id}`);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
  clearCart: async () => {
    await api.delete("/cart");
    set({ items: [] });
  },
  get count() {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
  get subtotal() {
    return get().items.reduce((sum, i) => {
      const price = i.isCase && i.product.casePrice ? Number(i.product.casePrice) : Number(i.product.unitPrice);
      return sum + price * i.quantity;
    }, 0);
  },
}));
