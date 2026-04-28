'use client'
import { assets } from "@/assets/assets";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { createAddressRequest, fetchAddressByIdRequest, updateAddressRequest } from "@/lib/api/address";
import { successToast, errorToast } from "@/lib/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

const AddAddressForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const addressId = searchParams.get('id');
    const { isSignedIn, isLoaded, openSignIn } = useAppContext();
    
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            openSignIn();
        }
    }, [isLoaded, isSignedIn, openSignIn]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(!!addressId);
    const [address, setAddress] = useState({
        fullName: '',
        phoneNumber: '',
        pincode: '',
        area: '',
        city: '',
        state: '',
        isDefault: false
    })

    useEffect(() => {
        if (addressId) {
            const fetchAddress = async () => {
                try {
                    const data = await fetchAddressByIdRequest(addressId);
                    if (data.success) {
                        setAddress({
                            fullName: data.address.fullName,
                            phoneNumber: data.address.phoneNumber,
                            pincode: data.address.pincode,
                            area: data.address.area,
                            city: data.address.city,
                            state: data.address.state,
                            isDefault: data.address.isDefault
                        });
                    }
                } catch (error) {
                    errorToast("Failed to fetch address details");
                } finally {
                    setLoading(false);
                }
            };
            fetchAddress();
        }
    }, [addressId]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        try {
            setIsSubmitting(true);
            let data;
            if (addressId) {
                data = await updateAddressRequest(addressId, address);
            } else {
                data = await createAddressRequest(address);
            }

            if (data.success) {
                successToast(addressId ? "Address updated successfully!" : "Address saved successfully!");
                router.back();
            }
        } catch (error) {
            errorToast(error.message || "Failed to save address");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between">
            <form onSubmit={onSubmitHandler} className="w-full">
                <p className="text-2xl md:text-3xl text-gray-500">
                    {addressId ? "Edit" : "Add"} Shipping <span className="font-semibold text-orange-600">Address</span>
                </p>
                <div className="space-y-3 max-w-sm mt-10">
                    <input
                        className="px-2 py-2.5 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                        type="text"
                        placeholder="Full name"
                        required
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        value={address.fullName}
                    />
                    <input
                        className="px-2 py-2.5 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                        type="text"
                        placeholder="Phone number"
                        required
                        onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                        value={address.phoneNumber}
                    />
                    <input
                        className="px-2 py-2.5 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                        type="number"
                        placeholder="Pin code"
                        required
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        value={address.pincode}
                    />
                    <textarea
                        className="px-2 py-2.5 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500 resize-none"
                        type="text"
                        rows={4}
                        placeholder="Address (Area and Street)"
                        required
                        onChange={(e) => setAddress({ ...address, area: e.target.value })}
                        value={address.area}
                    ></textarea>
                    <div className="flex space-x-3">
                        <input
                            className="px-2 py-2.5 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                            type="text"
                            placeholder="City/District/Town"
                            required
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            value={address.city}
                        />
                        <input
                            className="px-2 py-2.5 focus:border-orange-500 transition border border-gray-500/30 rounded outline-none w-full text-gray-500"
                            type="text"
                            placeholder="State"
                            required
                            onChange={(e) => setAddress({ ...address, state: e.target.value })}
                            value={address.state}
                        />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <input 
                            type="checkbox" 
                            id="isDefault"
                            checked={address.isDefault}
                            onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })}
                            className="w-4 h-4 accent-orange-600 cursor-pointer"
                        />
                        <label htmlFor="isDefault" className="text-gray-500 cursor-pointer select-none">Set as default address</label>
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`max-w-sm w-full mt-6 bg-orange-600 text-white py-3 hover:bg-orange-700 uppercase transition-all flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                    {isSubmitting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {addressId ? "Updating..." : "Saving..."}
                        </>
                    ) : (addressId ? "Update address" : "Save address")}
                </button>
            </form>
            <Image
                className="md:mr-16 mt-16 md:mt-0"
                src={assets.my_location_image}
                alt="my_location_image"
            />
        </div>
    );
};

const AddAddress = () => {
    return (
        <>
            <Navbar />
            <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                <AddAddressForm />
            </Suspense>
            <Footer />
        </>
    );
};

export default AddAddress;
