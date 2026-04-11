import { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";

export const useCart = () => {
  const {
    cartItems,
    addToCart,
    updateCartQuantity,
    clearCart,
    getCartAmount,
    getCartCount,
  } = useAppContext();

  return useMemo(
    () => ({
      cartItems,
      addToCart,
      updateCartQuantity,
      clearCart,
      getCartAmount,
      getCartCount,
    }),
    [
      cartItems,
      addToCart,
      updateCartQuantity,
      clearCart,
      getCartAmount,
      getCartCount,
    ]
  );
};

export default useCart;

