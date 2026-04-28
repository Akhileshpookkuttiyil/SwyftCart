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
      isSyncing: false,

      // Initialize state (for merging guest cart)
      setCartItems: (items) => set({ cartItems: items }),

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
        const currentItems = get().cartItems;
        const newItems = { ...currentItems, [productId]: (currentItems[productId] || 0) + 1 };
        
        set({ cartItems: newItems });

        if (!isSignedIn) {
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
        }
      },

      updateQuantity: async (productId, quantity, isSignedIn) => {
        const currentItems = get().cartItems;
        const newItems = { ...currentItems };
        
        if (quantity <= 0) delete newItems[productId];
        else newItems[productId] = Math.floor(quantity);

        set({ cartItems: newItems });

        if (!isSignedIn) return;

        try {
          const response = await updateCartItemRequest(productId, quantity);
          if (response.success) {
            set({ cartItems: get()._sanitizeItems(response.cartItems) });
          }
        } catch (error) {
          set({ cartItems: currentItems });
          errorToast(error.message || "Failed to update quantity");
        }
      },

      clearCart: async (isSignedIn) => {
        const currentItems = get().cartItems;
        set({ cartItems: {} });

        if (!isSignedIn) return;

        try {
          const response = await clearCartRequest();
          if (response.success) {
            set({ cartItems: {} });
            successToast("Cart cleared");
          }
        } catch (error) {
          set({ cartItems: currentItems });
          errorToast(error.message || "Failed to clear cart");
        }
      },

      mergeCart: async (guestItems) => {
        if (!Object.keys(guestItems).length) return;
        try {
          const response = await mergeGuestCartRequest(guestItems);
          if (response.success) {
            set({ cartItems: get()._sanitizeItems(response.cartItems) });
          }
        } catch (error) {
          console.error("Cart merge error:", error);
        }
      },

      getCartCount: () => {
        return Object.values(get().cartItems).reduce((sum, q) => sum + q, 0);
      },

      getCartAmount: (products) => {
        return Object.entries(get().cartItems).reduce((sum, [id, qty]) => {
          const p = products.find(item => item._id === id);
          return sum + (p ? (p.offerPrice ?? p.price) * qty : 0);
        }, 0);
      }
    }),
    {
      name: GUEST_CART_KEY,
      partialize: (state) => ({ cartItems: state.cartItems }),
    }
  )
);
