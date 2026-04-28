import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      userData: null,
      isSeller: false,
      currency: process.env.NEXT_PUBLIC_CURRENCY || "₹",
      setUserData: (userData) => set({ userData }),
      setIsSeller: (isSeller) => set({ isSeller }),
      clearUser: () => set({ userData: null, isSeller: false }),
    }),
    {
      name: "swyftcart-user",
    }
  )
);
