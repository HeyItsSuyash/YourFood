"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronRight, Plus, Minus, ShoppingBag, Check, Sparkles, ArrowRight, X } from "lucide-react";
import { MenuItem, MOCK_MENU } from "@/lib/mockData";

interface GourmetMenuProps {
  onPlaceOrder: (items: { item: MenuItem; quantity: number }[]) => void;
}

export function GourmetMenu({ onPlaceOrder }: GourmetMenuProps) {
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);

  function addItem(item: MenuItem) {
    setCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  }

  function removeItem(itemId: string) {
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[itemId] > 1) {
        copy[itemId] -= 1;
      } else {
        delete copy[itemId];
      }
      return copy;
    });
  }

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MOCK_MENU.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  function handleCheckout() {
    const orderPayload = Object.entries(cart)
      .map(([id, qty]) => {
        const item = MOCK_MENU.find((m) => m.id === id);
        return item ? { item, quantity: qty } : null;
      })
      .filter((x): x is { item: MenuItem; quantity: number } => x !== null);

    if (orderPayload.length > 0) {
      onPlaceOrder(orderPayload);
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-white text-neutral-900 overflow-x-hidden font-sans">
      {/* 
        TOP HEADER WITH THE EXACT IMAGE BACKGROUND:
        The uploaded image contains the deep royal blue curve, Table & Thyme logo,
        bold FOOD MENU, FRESH & TASTY, gold pill, and the angled wooden cutting board with bowls.
      */}
      <div className="relative w-full aspect-[9/10] overflow-hidden">
        {/* Mockup Background Image */}
        <Image
          src="/menu-bg.png"
          alt="Table & Thyme Food Menu"
          fill
          priority
          className="object-cover object-top select-none pointer-events-none"
        />

        {/* Dynamic / Interactive Overlay on top of the image for visual crispness */}
        <div className="absolute inset-0 pt-10 px-6 pointer-events-none flex flex-col justify-start">
          {/* Subtle status bar spacing */}
          <div className="flex justify-between items-center text-xs text-white/80 font-semibold mb-6">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
              <span className="text-[10px]">5G</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        LOWER SECTION: FOOD TITLE & INTERACTIVE DISH LISTINGS
        Exactly matches the font, sizing, arrow chevron, and ₹ pricing from image.png
      */}
      <div className="px-6 -mt-10 relative z-10 pb-32 bg-white">
        {/* Section Heading: "Food" */}
        <div className="mb-4">
          <h2 className="text-3xl font-extrabold text-[#0D1B2A] tracking-tight">
            Food
          </h2>
        </div>

        {/* Menu Items List with Interactive Row & Quick Add */}
        <div className="divide-y divide-neutral-100">
          {MOCK_MENU.map((item) => {
            const qty = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className="py-4 flex items-start justify-between gap-4 group transition-colors hover:bg-neutral-50/60 rounded-xl px-2 -mx-2"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedItemDetail(item)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0D1B2A] group-hover:text-primary-600 transition-colors">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed max-w-[240px]">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-[#0D1B2A]">
                      ₹{item.price}
                    </span>
                    <button
                      onClick={() => setSelectedItemDetail(item)}
                      className="text-neutral-400 group-hover:text-neutral-800 transition-colors"
                      aria-label="View Details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quantity Controls / Add Button */}
                  <div className="mt-2.5">
                    {qty === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        className="px-3 py-1 rounded-full bg-[#0D1B2A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-2 py-0.5 border border-neutral-200">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-neutral-700 hover:text-black shadow-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#0D1B2A] min-w-3 text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addItem(item)}
                          className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-neutral-700 hover:text-black shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-float space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                  Table & Thyme Kitchen
                </span>
                <h3 className="text-xl font-bold text-[#0D1B2A]">
                  {selectedItemDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed">
              {selectedItemDetail.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-2xl font-black text-[#0D1B2A]">
                ₹{selectedItemDetail.price}
              </span>

              <button
                onClick={() => {
                  addItem(selectedItemDetail);
                  setSelectedItemDetail(null);
                }}
                className="py-2.5 px-6 rounded-full bg-[#0D1B2A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Checkout Drawer */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 max-w-md mx-auto px-4">
          <div className="p-4 rounded-2xl bg-[#0D1B2A] text-white shadow-float flex items-center justify-between gap-4 border border-white/10 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-neutral-300 block">
                  {totalCartCount} item(s) selected
                </span>
                <span className="text-base font-bold text-white">
                  ₹{totalAmount}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="py-2.5 px-5 rounded-xl bg-white hover:bg-neutral-100 text-[#0D1B2A] font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
            >
              <span>Review & Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}