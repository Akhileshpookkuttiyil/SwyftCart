import { addressDummyData } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import { placeOrderRequest } from "@/lib/api/order";
import { errorToast, successToast } from "@/lib/toast";

const OrderSummary = () => {

  const { formatPrice, router, getCartCount, getCartAmount, fetchUserData, cartItems } = useAppContext()
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const [userAddresses, setUserAddresses] = useState([]);

  const fetchUserAddresses = async () => {
    setUserAddresses(addressDummyData);
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

    const amount = getCartAmount() + Math.floor(getCartAmount() * 0.02);

    try {
        const payload = {
            address: selectedAddress,
            items,
            amount,
            paymentMethod
        };
        const data = await placeOrderRequest(payload);
        if (data.success) {
            if (paymentMethod === "COD") {
              successToast("Order placed successfully!", "order-success");
              fetchUserData();
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
                      successToast("Payment successful!", "payment-success");
                      fetchUserData();
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
    }
  }

  useEffect(() => {
    fetchUserAddresses();
  }, [])

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
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
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
            <p className="text-gray-800">{formatPrice(getCartAmount())}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="font-medium text-gray-800">Free</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Tax (2%)</p>
            <p className="font-medium text-gray-800">
              {formatPrice(Math.floor(getCartAmount() * 0.02))}
            </p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{formatPrice(getCartAmount() + Math.floor(getCartAmount() * 0.02))}</p>
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

      <button onClick={createOrder} className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700">
        Place Order
      </button>
    </div>
  );
};

export default OrderSummary;
