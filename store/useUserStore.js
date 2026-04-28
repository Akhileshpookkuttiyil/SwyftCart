import { create } from "zustand";

export const useUserStore = create((set) => ({
  userData: null,
  isSeller: false,
  currency: process.env.NEXT_PUBLIC_CURRENCY || "₹",
  setUserData: (userData) => set({ userData }),
  setIsSeller: (isSeller) => set({ isSeller }),
  clearUser: () => set({ userData: null, isSeller: false }),
}));
