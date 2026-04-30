import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  addToCartRequest, 
  updateCartItemRequest, 
  clearCartRequest,
  mergeGuestCartRequest 
} from "@/lib/api/cart";
import { errorToast, successToast } from "@/lib/toast";

const GUEST_CART_KEY = "swyftcart_guest_cart";

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: {},
      cartOwner: "guest",
      isSyncing: false,
      hasHydrated: false,

      // Initialize state (for merging guest cart)
      setCartItems: (items, cartOwner = get().cartOwner) =>
        set({
          cartItems: get()._sanitizeItems(items),
          cartOwner,
          hasHydrated: true,
        }),
      setCartOwner: (cartOwner) => set({ cartOwner }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      /**
       * Ensures cart items are valid numeric quantities
       * @param {Object} items - raw cart object { productId: quantity }
       */
      _sanitizeItems: (items) => {
        if (!items || typeof items !== "object" || Array.isArray(items)) return {};
        return Object.entries(items).reduce((acc, [id, qty]) => {
          const q = Math.max(Number(qty) || 0, 0);
          if (q > 0) acc[id] = Math.floor(q);
          return acc;
        }, {});
      },

      addToCart: async (productId, isSignedIn) => {
        if (get().isSyncing) return; // Prevent concurrent writes
        
        const currentItems = get().cartItems;
        const newItems = { ...currentItems, [productId]: (currentItems[productId] || 0) + 1 };
        
        set({ cartItems: newItems, isSyncing: true });

        if (!isSignedIn) {
          set({ isSyncing: false, cartOwner: "guest" });
          successToast("Added to cart", "cart-success");
          return;
        }

        try {
          const response = await addToCartRequest(productId, 1);
          if (response.success) {
            set({ cartItems: get()._sanitizeItems(response.cartItems) });
            successToast("Added to cart", "cart-success");
          }
        } catch (error) {
          set({ cartItems: currentItems });
          errorToast(error.message || "Failed to add to cart");
        } finally {
          set({ isSyncing: false });
        }
      },

      updateQuantity: async (productId, quantity, isSignedIn) => {
        if (get().isSyncing) return;
        
        const currentItems = get().cartItems;
        const newItems = { ...currentItems };
        
        if (quantity <= 0) delete newItems[productId];
        else newItems[productId] = Math.floor(quantity);

        set({ cartItems: newItems, isSyncing: true });

        if (!isSignedIn) {
          set({ isSyncing: false, cartOwner: "guest" });
          return;
        }

        try {
          const response = await updateCartItemRequest(productId, quantity);
          if (response.success) {
            set({ cartItems: get()._sanitizeItems(response.cartItems) });
          }
        } catch (error) {
          set({ cartItems: currentItems });
          errorToast(error.message || "Failed to update quantity");
        } finally {
          set({ isSyncing: false });
        }
      },

      clearCart: async (isSignedIn, options = {}) => {
        const currentItems = get().cartItems;
        set({ cartItems: {}, cartOwner: isSignedIn ? get().cartOwner : "guest" });

        if (!isSignedIn) return;

        try {
          const response = await clearCartRequest();
          if (response.success) {
            set({ cartItems: {} });
            if (!options.silent) {
              successToast("Cart cleared");
            }
          }
        } catch (error) {
          set({ cartItems: currentItems });
          errorToast(error.message || "Failed to clear cart");
        }
      },

      mergeCart: async (guestItems) => {
        if (!Object.keys(guestItems).length || get().isSyncing) return;
        set({ isSyncing: true });
        try {
          const response = await mergeGuestCartRequest(guestItems);
          if (response.success) {
            set({ cartItems: get()._sanitizeItems(response.cartItems) });
          }
        } catch (error) {
          console.error("Cart merge error:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      getCartCount: () => {
        return Object.values(get().cartItems).reduce((sum, q) => sum + q, 0);
      },

      getCartAmount: (products) => {
        if (!Array.isArray(products)) return 0;
        return Object.entries(get().cartItems).reduce((sum, [id, qty]) => {
          const p = products.find(item => item._id === id);
          return sum + (p ? (p.offerPrice ?? p.price) * qty : 0);
        }, 0);
      }
    }),
    {
      name: GUEST_CART_KEY,
      partialize: (state) => ({
        cartItems: state.cartItems,
        cartOwner: state.cartOwner,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.(true);
      },
    }
  )
);
