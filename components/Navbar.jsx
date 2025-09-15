"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useAppContext } from "@/context/AppContext";
import { assets, BoxIcon, CartIcon } from "@/assets/assets";

const Navbar = () => {
  const { isSeller, router, cartItems } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/all-products", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-200 bg-white text-gray-700 shadow-sm">
      {/* Logo */}
      <button onClick={() => router.push("/")} aria-label="Go to Home">
        <Image
          src={assets.logo}
          alt="QuickCart Logo"
          width={128}
          height={40}
          priority
          className="w-28 md:w-32 cursor-pointer"
        />
      </button>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 lg:gap-10">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-blue-600 transition"
          >
            {link.label}
          </Link>
        ))}

        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
          >
            Seller Dashboard
          </button>
        )}
      </div>

      {/* Right Controls (Desktop + Mobile) */}
      <div className="flex items-center gap-4">
        {/* Search (desktop only) */}
        <Image
          src={assets.search_icon}
          alt="Search"
          width={20}
          height={20}
          className="hidden md:block w-5 h-5 cursor-pointer hover:opacity-80"
        />

        {/* Cart */}
        <button
          onClick={() => router.push("/cart")}
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Cart"
        >
          <CartIcon className="w-6 h-6 text-gray-700" />
          {cartItems?.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>

        {/* Auth Controls */}
        <SignedOut>
          <SignInButton>
            <button className="px-4 py-1.5 text-sm bg-gray-200 text-white rounded-full hover:bg-blue-700 transition">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8", // consistent avatar
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Orders"
                labelIcon={<BoxIcon />}
                onClick={() => router.push("/my-orders")}
              />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-100 transition md:hidden"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md border-t border-gray-200 flex flex-col items-start px-6 py-4 space-y-4 md:hidden z-50 animate-slide-down">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}

          {isSeller && (
            <button
              onClick={() => {
                router.push("/seller");
                setIsOpen(false);
              }}
              className="text-left text-xs border border-orange-300 px-5 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
              Seller
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
