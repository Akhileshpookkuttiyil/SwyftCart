'use client'
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchAddressesRequest, deleteAddressRequest, setDefaultAddressRequest } from "@/lib/api/address";
import { successToast, errorToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { Spinner } from "@heroui/react";

const MyAddresses = () => {
  const { isSignedIn, isLoaded, router, openSignIn } = useAppContext();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const data = await fetchAddressesRequest();
      if (data.success) {
        setAddresses(data.addresses);
      }
    } catch (error) {
      errorToast(error.message || "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const data = await deleteAddressRequest(id);
      if (data.success) {
        successToast("Address deleted");
        fetchAddresses();
      }
    } catch (error) {
      errorToast(error.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const data = await setDefaultAddressRequest(id);
      if (data.success) {
        successToast("Default address updated");
        fetchAddresses();
      }
    } catch (error) {
      errorToast(error.message || "Failed to set default address");
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        fetchAddresses();
      } else {
        openSignIn();
      }
    }
  }, [isLoaded, isSignedIn, openSignIn]);

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-12 min-h-[70vh]">
        <div className="flex justify-between items-center mb-10">
          <p className="text-2xl md:text-3xl text-gray-500">
            My <span className="font-semibold text-orange-600">Addresses</span>
          </p>
          <button
            onClick={() => {
                if (!isSignedIn) {
                    openSignIn();
                } else {
                    router.push("/add-address");
                }
            }}
            className="bg-orange-600 text-white px-6 py-2 hover:bg-orange-700 transition"
          >
            + Add New Address
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner color="warning" size="lg" label="Loading addresses..." />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-lg">
            <Image src={assets.my_location_image} alt="no-address" className="w-32 h-32 opacity-20 mb-4" />
            <p className="text-gray-500 text-lg">No addresses found.</p>
            <button
              onClick={() => {
                if (!isSignedIn) {
                    openSignIn();
                } else {
                    router.push("/add-address");
                }
              }}
              className="mt-4 text-orange-600 font-medium hover:underline"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`border p-5 rounded-lg transition-all ${
                  addr.isDefault ? "border-orange-600 bg-orange-50/30" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="font-semibold text-gray-800">{addr.fullName}</p>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded uppercase font-bold">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{addr.area}</p>
                  <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p>Phone: {addr.phoneNumber}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100 flex gap-4 text-sm font-medium">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/add-address?id=${addr._id}`)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyAddresses;
