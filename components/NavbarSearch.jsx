"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchProductListRequest } from "@/lib/api/products";
import { normalizeProductRecord } from "@/lib/productCatalog";
import { assets } from "@/assets/assets";

import { X } from "lucide-react";

export default function NavbarSearch() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      return;
    }
    
    let active = true;
    setLoading(true);
    fetchProductListRequest({ search: debouncedQuery, limit: 5 })
      .then((data) => {
        if (!active) return;
        if (data?.success) {
          setSuggestions((data.products || []).map(normalizeProductRecord));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
      
    return () => { active = false; };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (productId) => {
    setExpanded(false);
    setQuery("");
    router.push(`/product/${productId}`);
  };

  const searchRedirect = () => {
    if (query.trim()) {
      setExpanded(false);
      router.push(`/all-products?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchRedirect();
    }
  };

  return (
    <div className="relative flex items-center" ref={containerRef}>
      <div 
        className={`flex items-center transition-all overflow-hidden h-9 ${expanded ? "w-64 border bg-gray-50 rounded-full px-3" : "w-10 bg-transparent justify-end"}`}
      >
        <div 
          onClick={() => {
            if (!expanded) {
               setExpanded(true);
            }
          }}
          className={`cursor-pointer p-1.5 ${!expanded && "hover:bg-gray-100 rounded-full"}`}
        >
          <Image
            src={assets.search_icon}
            alt="Search"
            width={20}
            height={20}
            className="w-5 h-5 opacity-70"
          />
        </div>
        
        {expanded && (
          <div className="flex items-center w-full ml-2">
            <input
              type="text"
              className="bg-transparent w-full outline-none text-sm text-gray-700"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && query && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {loading ? (
             <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : suggestions.length > 0 ? (
             <div className="flex flex-col">
               {suggestions.map(item => (
                 <button 
                   key={item._id} 
                   className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition"
                   onClick={() => handleSelect(item._id)}
                 >
                   <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <Image 
                        src={item.image[0] || assets.upload_area} 
                        alt={item.name} 
                        width={40} 
                        height={40} 
                        className="object-cover w-full h-full"
                      />
                   </div>
                   <div className="flex flex-col overflow-hidden">
                     <span className="text-sm text-gray-800 truncate font-medium">{item.name}</span>
                     <span className="text-xs text-gray-500 truncate">{item.category}</span>
                   </div>
                 </button>
               ))}
               <button 
                 onClick={searchRedirect}
                 className="px-3 py-2 text-xs text-center border-t text-blue-600 hover:bg-blue-50 focus:bg-blue-50"
               >
                 View all results for "{query}"
               </button>
             </div>
          ) : (
             <div className="px-4 py-3 text-sm text-gray-500">No results found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}
