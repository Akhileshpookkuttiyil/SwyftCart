import { useMemo } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@clerk/nextjs";

export const useCart = () => {
  const { isSignedIn } = useAuth();
  const {
    cartItems,
    addToCart: addToCartZustand,
    updateQuantity,
    clearCart: clearCartZustand,
    getCartAmount,
    getCartCount,
  } = useCartStore();

  return useMemo(
    () => ({
      cartItems,
      addToCart: (id) => addToCartZustand(id, isSignedIn),
      updateCartQuantity: (id, qty) => updateQuantity(id, qty, isSignedIn),
      clearCart: (options) => clearCartZustand(isSignedIn, options),
      getCartAmount,
      getCartCount,
    }),
    [
      cartItems,
      addToCartZustand,
      updateQuantity,
      clearCartZustand,
      getCartAmount,
      getCartCount,
      isSignedIn,
    ]
  );
};

export default useCart;

