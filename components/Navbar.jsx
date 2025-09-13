"use client";

import React from "react";
import { assets } from "@/assets/assets";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

const Navbar = () => {
  const { isSeller, router } = useAppContext();

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-200 bg-white text-gray-700 shadow-sm">
      {/* Logo */}
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push("/")}
        src={assets.logo}
        alt="QuickCart Logo"
        priority
      />

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 lg:gap-10">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Shop
        </Link>
        <Link href="/about" className="hover:text-gray-900 transition">
          About Us
        </Link>
        <Link href="/contact" className="hover:text-gray-900 transition">
          Contact
        </Link>

        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
          >
            Seller Dashboard
          </button>
        )}
      </div>

      {/* Right Side (Desktop) */}
      <div className="hidden md:flex items-center gap-5">
        <Image
          className="w-5 h-5 cursor-pointer hover:opacity-80"
          src={assets.search_icon}
          alt="Search"
        />

        <SignedOut>
          <SignInButton>
            <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton signInUrl="/" />
        </SignedIn>
      </div>

      {/* Mobile Menu */}
      <div className="flex md:hidden items-center gap-3">
        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
          >
            Seller
          </button>
        )}

        <SignedOut>
          <SignInButton mode="redirect">
            <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton signInUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
