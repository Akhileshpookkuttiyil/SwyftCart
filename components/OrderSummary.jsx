import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { placeOrderRequest } from "@/lib/api/order";
import { fetchAddressesRequest } from "@/lib/api/address";
import { errorToast, successToast } from "@/lib/toast";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";

const OrderSummary = ({ products }) => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const currency = useUserStore((state) => state.currency);
  const { cartItems, getCartCount, getCartAmount, clearCart } = useCartStore();

  const formatPrice = useCallback(
    (value) => formatCurrencyValue(value, currency),
    [currency]
  );
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const [userAddresses, setUserAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const fetchUserAddresses = async () => {
    if (!isSignedIn) {
      setLoadingAddresses(false);
      return;
    }
    try {
      setLoadingAddresses(true);
      const data = await fetchAddressesRequest();
      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          const defaultAddr = data.addresses.find(a => a.isDefault) || data.addresses[0];
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error("Fetch addresses error:", error);
    } finally {
      setLoadingAddresses(false);
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => console.error("Failed to load Razorpay script");
      document.body.appendChild(script);
    };
    loadRazorpayScript();
  }, []);

  const createOrder = async () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (!selectedAddress) {
        return errorToast("Please select a delivery address", "address-error");
    }
    const items = Object.keys(cartItems).map(id => ({
      product: id,
      quantity: cartItems[id]
    })).filter(item => item.quantity > 0);

    if (items.length === 0) {
        return errorToast("Your cart is empty", "cart-error");
    }

    const amount = getCartAmount(products) + Math.floor(getCartAmount(products) * 0.02);

    try {
        setIsPlacing(true);
        const payload = {
            address: selectedAddress,
            items,
            amount,
            paymentMethod
        };
        const data = await placeOrderRequest(payload);
        if (data.success) {
            if (paymentMethod === "COD") {
              clearCart(isSignedIn);
              console.timeEnd("order-placement-to-success");
              successToast("Order placed successfully!", "order-success");
              router.push('/order-placed');
            } else if (paymentMethod === "ONLINE") {
              if (!isScriptLoaded) {
                return errorToast("Razorpay SDK not loaded", "rzp-error");
              }
              const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "SwyftCart",
                description: "Order Payment",
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                  try {
                    console.time("payment-verification");
                    const verifyRes = await fetch('/api/order/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId: data.orderId
                      })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                      clearCart(isSignedIn);
                      console.timeEnd("payment-verification");
                      successToast("Payment successful!", "payment-success");
                      // Fast redirect
                      router.push('/order-placed');
                    } else {
                      errorToast(verifyData.message || "Payment verification failed", "payment-failed");
                    }
                  } catch (error) {
                    errorToast("Payment verification failed", "payment-failed");
                  }
                },
                prefill: {
                  name: selectedAddress.fullName,
                  contact: selectedAddress.phoneNumber,
                },
                theme: {
                  color: "#ea580c" // Tailwind orange-600
                }
              };
              const rzp = new window.Razorpay(options);
              rzp.on('payment.failed', function (response){
                 errorToast("Payment failed: " + response.error.description, "payment-failed");
              });
              rzp.open();
            }
        } else {
          errorToast(data.message || "Failed to place order", "order-error");
        }
    } catch (error) {
        console.error("Place order error:", error);
        errorToast(error.message || "Failed to place order", "order-error");
    } finally {
        setIsPlacing(false);
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      fetchUserAddresses();
    } else {
      setLoadingAddresses(false);
    }
  }, [isSignedIn])

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none disabled:opacity-70"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={loadingAddresses}
            >
              <span>
                {loadingAddresses 
                  ? "Loading addresses..." 
                  : selectedAddress
                    ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                    : userAddresses.length === 0 
                      ? "No addresses found - Please add one"
                      : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5 max-h-60 overflow-y-auto">
                {userAddresses.length > 0 ? (
                  userAddresses.map((address, index) => (
                    <li
                      key={address._id || index}
                      className={`px-4 py-2 hover:bg-gray-500/10 cursor-pointer ${selectedAddress?._id === address._id ? "bg-orange-50 border-l-2 border-orange-600" : ""}`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <p className="font-medium">{address.fullName} {address.isDefault && <span className="text-[10px] text-orange-600 font-bold ml-1">(Default)</span>}</p>
                      <p className="text-xs text-gray-500 truncate">{address.area}, {address.city}</p>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-gray-400 text-center italic">No saved addresses</li>
                )}
                <li
                  onClick={() => {
                    if (!isSignedIn) {
                      openSignIn();
                    } else {
                      router.push("/add-address");
                    }
                  }}
                  className="px-4 py-2.5 hover:bg-gray-500/10 cursor-pointer text-center text-orange-600 font-medium border-t mt-1"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Items {getCartCount()}</p>
            <p className="text-gray-800">{formatPrice(getCartAmount(products))}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">
              {formatPrice(Math.floor(getCartAmount(products) * 0.02))}
            </p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{formatPrice(getCartAmount(products) + Math.floor(getCartAmount(products) * 0.02))}</p>
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-gray-500/30">
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Payment Method
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paymentMethod" 
                value="COD" 
                checked={paymentMethod === "COD"} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-gray-700">Cash on Delivery</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paymentMethod" 
                value="ONLINE" 
                checked={paymentMethod === "ONLINE"} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-gray-700">Pay Online (Razorpay)</span>
            </label>
          </div>
        </div>

      </div>

      <button 
        disabled={isPlacing} 
        onClick={createOrder} 
        className={`w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700 transition-all flex items-center justify-center gap-2 ${isPlacing ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {isPlacing ? (
          <>
            <Spinner size="sm" color="white" />
            Processing...
          </>
        ) : "Place Order"}
      </button>
    </div>
  );
};

export default OrderSummary;
