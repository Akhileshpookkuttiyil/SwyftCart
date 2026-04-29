"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, MapPin } from "lucide-react";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";
import { assets, BoxIcon, CartIcon, HeartIcon } from "@/assets/assets";
import NavbarSearch from "./NavbarSearch";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isSeller = useUserStore((state) => state.isSeller);
  const cartItems = useCartStore((state) => state.cartItems);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cartCount = isMounted 
    ? Object.values(cartItems).reduce((acc, qty) => acc + qty, 0) 
    : 0;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/all-products", label: "Shop" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-200 bg-white text-gray-700 shadow-sm">
      {/* Logo */}
      <Link href="/" aria-label="Go to Home">
        <Image
          src={assets.logo}
          alt="SwyftCart Logo"
          priority
          loading="eager"
          className="w-28 md:w-32 cursor-pointer"
          style={{ height: "auto" }}
        />


      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 lg:gap-10">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-2 text-sm font-medium transition-all duration-300 hover:text-orange-600 ${
                isActive ? "text-orange-600" : "text-gray-600"
              }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-500" />
              )}
            </Link>
          );
        })}

        {isSeller && (
          <Link
            href="/seller"
            className="text-xs border px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
          >
            Seller Dashboard
          </Link>
        )}
      </div>

      {/* Right Controls (Desktop + Mobile) */}
      <div className="flex items-center gap-4">
        {/* Search (desktop + expanding style) */}
        <div className="hidden md:block">
          <NavbarSearch />
        </div>

        {/* Cart */}
        <Link
          href="/cart"
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Cart"
        >
          <CartIcon className="w-6 h-6 text-gray-700" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Auth Controls */}
        <Show when="signed-out">
          <SignInButton>
            <button className="px-4 py-1.5 text-sm bg-gray-200 text-white rounded-full hover:bg-gray-400 transition">
              Sign In
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard:
                  "w-screen max-w-full rounded-none border-t md:w-64 md:rounded-xl md:shadow-md",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Orders"
                labelIcon={<BoxIcon />}
                onClick={() => router.push("/my-orders")}
              />
              <UserButton.Action
                label="My Addresses"
                labelIcon={<MapPin size={16} />}
                onClick={() => router.push("/my-addresses")}
              />
              <UserButton.Action
                label="Favourites"
                labelIcon={<HeartIcon />}
                onClick={() => router.push("/all-products?tab=favourites")}
              />
            </UserButton.MenuItems>
          </UserButton>
        </Show>


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
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`w-full py-2 px-4 rounded-lg text-base font-medium transition-colors ${
                  isActive 
                    ? "bg-orange-50 text-orange-600" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

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
