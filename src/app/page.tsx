"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  Puzzle,
  Gift,
  Star,
  Send,
  Download,
  MessageSquareQuote,
  Clock,
  RotateCcw,
  Receipt,
  MapPin,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { MenuItem, MOCK_MENU, MOCK_PRIZES, PrizeOption } from "@/lib/mockData";

type ActiveTab = "menu" | "order" | "puzzle" | "draw";

interface PlacedOrder {
  orderNumber: string;
  items: { item: MenuItem; quantity: number }[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  tableNumber: string;
  time: string;
}

// 9 Jigsaw Piece Definitions with SVG interlocking puzzle paths
// tab: 1 = outward knob, -1 = inward hole, 0 = flat border
const PUZZLE_TILES = [
  { id: 0, row: 0, col: 0, title: "Artisan Order", top: 0, right: 1, bottom: 1, left: 0 },
  { id: 1, row: 0, col: 1, title: "Install Fast Pass", top: 0, right: -1, bottom: 1, left: -1 },
  { id: 2, row: 0, col: 2, title: "Culinary Rating", top: 0, right: 0, bottom: -1, left: 1 },
  { id: 3, row: 1, col: 0, title: "Chef Private Notes", top: -1, right: 1, bottom: 1, left: 0 },
  { id: 4, row: 1, col: 1, title: "Gourmet Table Pass", top: -1, right: 1, bottom: -1, left: -1 },
  { id: 5, row: 1, col: 2, title: "Sommelier Special", top: 1, right: 0, bottom: 1, left: -1 },
  { id: 6, row: 2, col: 0, title: "Loyal Return Check", top: -1, right: -1, bottom: 0, left: 0 },
  { id: 7, row: 2, col: 1, title: "Patio Celebration", top: 1, right: 1, bottom: 0, left: 1 },
  { id: 8, row: 2, col: 2, title: "Grand Keystone", top: -1, right: 0, bottom: 0, left: -1 },
];

export default function GourmetExperiencePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);

  // Flow State
  const [currentOrder, setCurrentOrder] = useState<PlacedOrder | null>(null);
  
  // 3x3 (9 pieces) state. Starts with [0, 4] for immediate engaging progress
  const [collectedPieces, setCollectedPieces] = useState<number[]>([0, 4]);
  const [isFlipped, setIsFlipped] = useState(false);

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackToast, setFeedbackToast] = useState("");

  // Lucky Draw State
  const [preferredPrizeId, setPreferredPrizeId] = useState<string>(MOCK_PRIZES[0].id);
  const [isDrawing, setIsDrawing] = useState(false);
  const [wonPrize, setWonPrize] = useState<PrizeOption | null>(null);
  const [voucherCode, setVoucherCode] = useState<string>("");

  // PWA Prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ActiveTab;
      if (tabParam && ["menu", "order", "puzzle", "draw"].includes(tabParam)) {
        setActiveTab(tabParam);
      }

      const savedPieces = localStorage.getItem("tablethyme_pieces_3x3");
      if (savedPieces) {
        try {
          const parsed = JSON.parse(savedPieces);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCollectedPieces(parsed);
          }
        } catch {}
      }

      const savedOrder = localStorage.getItem("tablethyme_order");
      if (savedOrder) {
        try {
          setCurrentOrder(JSON.parse(savedOrder));
        } catch {}
      }

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }
  }, []);

  function savePieces(pieces: number[]) {
    setCollectedPieces(pieces);
    localStorage.setItem("tablethyme_pieces_3x3", JSON.stringify(pieces));
    if (pieces.length === 9) {
      setTimeout(() => {
        setIsFlipped(true);
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
      }, 600);
    }
  }

  // Cart operations
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
  const subtotalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MOCK_MENU.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const taxAmount = Math.round(subtotalAmount * 0.05);
  const serviceAmount = Math.round(subtotalAmount * 0.05);
  const grandTotal = subtotalAmount + taxAmount + serviceAmount;

  // Ordering Action
  function handlePlaceOrder() {
    const orderItems = Object.entries(cart)
      .map(([id, qty]) => {
        const item = MOCK_MENU.find((m) => m.id === id);
        return item ? { item, quantity: qty } : null;
      })
      .filter((x): x is { item: MenuItem; quantity: number } => x !== null);

    if (orderItems.length === 0) return;

    const newOrder: PlacedOrder = {
      orderNumber: `TT-${Math.floor(1000 + Math.random() * 9000)}`,
      items: orderItems,
      subtotal: subtotalAmount,
      tax: taxAmount,
      serviceCharge: serviceAmount,
      total: grandTotal,
      tableNumber: "Table 07 (Garden Terrace)",
      time: "Just now",
    };

    setCurrentOrder(newOrder);
    localStorage.setItem("tablethyme_order", JSON.stringify(newOrder));
    setCart({});

    // Unlock Piece 0 & Piece 5
    const updated = Array.from(new Set([...collectedPieces, 0, 5]));
    savePieces(updated);

    setActiveTab("order");
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  }

  function unlockPieceById(id: number, message: string) {
    if (!collectedPieces.includes(id)) {
      const updated = Array.from(new Set([...collectedPieces, id]));
      savePieces(updated);
      setFeedbackToast(message);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
      setTimeout(() => setFeedbackToast(""), 3500);
    }
  }

  function handleInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === "accepted") {
          unlockPieceById(1, "Installed! Jigsaw Piece Unlocked.");
        }
      });
    }
    unlockPieceById(1, "App Saved to Screen! Piece Unlocked.");
  }

  function handleSubmitFeedback() {
    if (!feedbackText.trim()) return;
    setShowFeedbackModal(false);
    const updated = Array.from(new Set([...collectedPieces, 2, 3]));
    savePieces(updated);
    setFeedbackToast("Feedback received! Jigsaw Pieces Unlocked.");
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    setTimeout(() => setFeedbackToast(""), 4000);
  }

  function handleUnlockRemainingAll() {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    savePieces(all);
    setFeedbackToast("All 9 Pieces assembled! Card flipping to reveal exclusive offers...");
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
  }

  function handleExecuteDraw() {
    setIsDrawing(true);
    setTimeout(() => {
      setIsDrawing(false);
      const chosen = MOCK_PRIZES.find((p) => p.id === preferredPrizeId) || MOCK_PRIZES[0];
      setWonPrize(chosen);
      setVoucherCode(`TT-CHEF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 } });
    }, 1200);
  }

  const isPuzzleComplete = collectedPieces.length >= 9;

  return (
    <div className="relative min-h-screen text-[#051D45] flex flex-col items-center font-sans">
      {/* 
        Menu Shell:
        NO background styling on container. 100% transparent/white natural flow.
      */}
      <div className="w-full max-w-[430px] min-h-screen relative flex flex-col pb-24 overflow-x-hidden">
        
        {/* ======================================================== */}
        {/* 1. MENU VIEW: image.png AS BACKGROUND + TEXT OVERLAY     */}
        {/* ======================================================== */}
        {activeTab === "menu" && (
          <div className="w-full flex flex-col relative">
            
            {/* 
              Top Section with image.png Background:
              Tightened aspect ratio so the bowls sit right above Food.
            */}
            <div className="relative w-full aspect-[940/930] overflow-hidden">
              <Image
                src="/image.png"
                alt="Table & Thyme Background"
                fill
                priority
                className="object-cover object-top select-none pointer-events-none"
              />

              {/* 
                TEXT & LOGO OVERLAY STYLED EXACTLY AS IN Table & Thyme Food Menu.png:
                - Golden Double Leaf Icon + TABLE & THYME
                - FOOD MENU (Large bold white typography)
                - FRESH & TASTY (Tracked subtitle)
                - Golden rounded pill bar
              */}
              <div className="absolute inset-0 pt-9 px-8 pointer-events-none z-10 flex flex-col justify-start">
                
                {/* Brand Logo: Golden Leaf + TABLE & THYME */}
                <div className="flex items-center gap-2.5 mb-4">
                  <svg
                    viewBox="0 0 50 48"
                    className="w-5 h-5 text-[#F6C16A] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 25 44 C 14 36 4 28 4 14 C 18 14 24 22 25 44 Z" />
                    <path d="M 25 44 C 36 36 46 28 46 14 C 32 14 26 22 25 44 Z" />
                    <line x1="25" y1="44" x2="25" y2="20" strokeWidth="2.5" />
                    <line x1="25" y1="32" x2="16" y2="24" strokeWidth="2" />
                    <line x1="25" y1="30" x2="34" y2="22" strokeWidth="2" />
                  </svg>
                  <span className="text-[13px] font-bold text-white tracking-[0.22em] uppercase leading-none">
                    TABLE & THYME
                  </span>
                </div>

                {/* Main Heading: FOOD MENU */}
                <div className="leading-[0.88] select-none">
                  <h1 className="text-[44px] sm:text-[46px] font-black text-white tracking-[-0.03em] uppercase block">
                    FOOD
                  </h1>
                  <h1 className="text-[44px] sm:text-[46px] font-black text-white tracking-[-0.03em] uppercase block mt-1">
                    MENU
                  </h1>
                </div>

                {/* Subtitle: FRESH & TASTY */}
                <div className="mt-2.5">
                  <span className="text-[11px] font-bold text-white/95 tracking-[0.24em] uppercase block">
                    FRESH & TASTY
                  </span>
                </div>

                {/* Golden Accent Pill */}
                <div className="mt-2.5">
                  <div className="w-[52px] h-[7px] rounded-full bg-[#F6C16A] shadow-xs" />
                </div>
              </div>
            </div>

            {/* 
              Lower Menu Content:
              Pulled higher (-mt-14) so "Food" aligns directly with the bottom curve of the bowl,
              exactly matching Table & Thyme Food Menu.png.
            */}
            <div className="px-8 -mt-14 relative z-20 pb-20">
              {/* "Food" Heading strictly matching source of truth */}
              <div className="mb-4">
                <h2 className="text-[34px] font-extrabold text-[#051D45] tracking-tight leading-none">
                  Food
                </h2>
              </div>

              {/* Menu Items List matching exact layout & dividers */}
              <div className="divide-y divide-[#E4E8EE]">
                {MOCK_MENU.map((item) => {
                  const qty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="py-5 flex items-start justify-between gap-4 group transition-colors"
                    >
                      <div
                        className="flex-1 cursor-pointer pr-2"
                        onClick={() => setSelectedItemDetail(item)}
                      >
                        <h3 className="text-[17px] font-bold text-[#051D45] group-hover:text-[#003B87] transition-colors leading-snug tracking-tight">
                          {item.name}
                        </h3>
                        <p className="text-[13px] text-[#7E89A4] mt-1.5 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0 pt-0.5">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={() => setSelectedItemDetail(item)}
                        >
                          <span className="text-[17px] font-bold text-[#051D45] tracking-tight">
                            ₹{item.price}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#051D45] stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </div>

                        <div className="mt-2.5">
                          {qty === 0 ? (
                            <button
                              onClick={() => addItem(item)}
                              className="px-3.5 py-1 rounded-full bg-[#051D45] hover:bg-[#003B87] text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              <span>Add</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-[#F1F3F7] rounded-full px-2 py-0.5 border border-[#D5DAE5]">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#051D45] hover:text-black shadow-xs font-bold"
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span className="text-xs font-bold text-[#051D45] min-w-3 text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => addItem(item)}
                                className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#051D45] hover:text-black shadow-xs font-bold"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
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

            {/* Floating Order Drawer */}
            {totalCartCount > 0 && (
              <div className="fixed bottom-20 left-0 right-0 z-30 max-w-[430px] mx-auto px-5">
                <div className="p-4 rounded-2xl bg-[#003B87] text-white shadow-2xl flex items-center justify-between gap-4 border border-white/10 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-100 block font-medium">
                        {totalCartCount} item(s) selected
                      </span>
                      <span className="text-base font-bold text-white tracking-tight">
                        ₹{grandTotal} <span className="text-[10px] text-blue-200 font-normal">(incl. tax)</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="py-2.5 px-5 rounded-xl bg-white hover:bg-neutral-100 text-[#003B87] font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                  >
                    <span>Place Order</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ORDER CONFIRMATION VIEW (NO EYEBROWS)                 */}
        {/* ======================================================== */}
        {activeTab === "order" && (
          <div className="p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E8EE]">
              <div>
                <h1 className="text-xl font-bold text-[#051D45]">Order Status</h1>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#F1F3F7] text-[#051D45]">
                {currentOrder?.orderNumber || "TT-2049"}
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E4E8EE] shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-lg font-bold text-[#051D45] tracking-tight leading-snug">
                Thank you, your order will be delivered shortly.
              </h2>

              <p className="text-xs text-[#7E89A4] mt-2 leading-relaxed max-w-xs">
                Our kitchen brigade is currently preparing your seasonal handcrafted bowls.
              </p>

              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#E4E8EE] text-xs text-[#7E89A4]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#003B87]" />
                  <span className="font-semibold text-[#051D45]">
                    {currentOrder?.tableNumber || "Table 07 (Garden Terrace)"}
                  </span>
                </div>
                <span className="text-neutral-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#003B87]" />
                  <span>Est. ~12-15 min</span>
                </div>
              </div>
            </div>

            {/* Jigsaw Teaser Card (No eyebrow badges) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#003B87] to-[#051D45] text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-white/20 text-white">
                    <Puzzle className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-bold text-white">
                    Jigsaw Crest
                  </span>
                </div>
                <span className="text-xs text-blue-100 font-medium">
                  {collectedPieces.length}/9 Pieces
                </span>
              </div>

              <div>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Your dining order unlocked crest pieces! Complete all 9 pieces to flip the card and reveal your exclusive offers.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("puzzle")}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#003B87] hover:bg-neutral-100 text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>View Jigsaw Puzzle</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Order Items Receipt */}
            <div className="p-5 rounded-3xl bg-white border border-[#E4E8EE] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#051D45] border-b border-[#E4E8EE] pb-2.5">
                <Receipt className="w-4 h-4 text-[#7E89A4]" />
                <span>Order Summary</span>
              </div>

              <div className="divide-y divide-[#E4E8EE] text-xs">
                {(currentOrder?.items || [
                  { item: MOCK_MENU[0], quantity: 1 },
                  { item: MOCK_MENU[1], quantity: 1 },
                ]).map(({ item, quantity }) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#051D45]">
                      {quantity}x {item.name}
                    </span>
                    <span className="font-bold text-[#051D45]">
                      ₹{item.price * quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E4E8EE] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#7E89A4]">
                  <span>Subtotal</span>
                  <span>₹{currentOrder?.subtotal || 528}</span>
                </div>
                <div className="flex justify-between text-[#7E89A4]">
                  <span>GST (5%)</span>
                  <span>₹{currentOrder?.tax || 26}</span>
                </div>
                <div className="flex justify-between text-[#7E89A4]">
                  <span>Service (5%)</span>
                  <span>₹{currentOrder?.serviceCharge || 26}</span>
                </div>
                <div className="flex justify-between text-[#051D45] font-bold text-sm pt-2 border-t border-[#E4E8EE]">
                  <span>Total Paid</span>
                  <span className="text-[#003B87]">₹{currentOrder?.total || 580}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. 3x3 JIGSAW PUZZLE: WHITE, DOTTED, INTERLOCKING SVG    */}
        {/* ======================================================== */}
        {activeTab === "puzzle" && (
          <div className="p-6 space-y-4 bg-white">
            <div className="text-center pt-2">
              <h2 className="text-2xl font-extrabold text-[#051D45] tracking-tight">
                Jigsaw Puzzle
              </h2>
              <p className="text-xs text-[#7E89A4] mt-1 max-w-xs mx-auto leading-relaxed">
                Assemble all 9 pieces to reveal the crest and flip the card for your exclusive dining offers.
              </p>
            </div>

            {/* Progress Count (No eyebrow badges) */}
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-[#051D45]">
              <span>Crest Assembly:</span>
              <span className="text-[#003B87] font-bold">
                {collectedPieces.length} of 9 Pieces Unlocked
              </span>
            </div>

            {/* 3D Flip Container */}
            <div className="perspective-1000 w-full min-h-[350px]">
              <div
                className={`relative w-full rounded-3xl transition-transform duration-700 transform-style-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* ---------------- FRONT: 3x3 CLEAN WHITE DOTTED JIGSAW ---------------- */}
                <div className="w-full bg-white rounded-3xl p-5 border border-[#E4E8EE] shadow-sm backface-hidden">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-[#D5DAE5]">
                    
                    {/* The Hidden Image Logo Revealed Underneath */}
                    <div className="absolute inset-0 z-0">
                      <Image
                        src="/crest-logo.png"
                        alt="Table & Thyme Crest Logo"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* 
                      3x3 Grid of Clean White Pieces with Dotted Interlocking Borders:
                      Locked pieces are pure white with subtle dotted borders and irregular connecting tabs.
                    */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-10">
                      {PUZZLE_TILES.map((tile) => {
                        const isUnlocked = collectedPieces.includes(tile.id);
                        return (
                          <div
                            key={tile.id}
                            className={`relative transition-all duration-500 flex items-center justify-center overflow-hidden ${
                              isUnlocked ? "bg-transparent" : "bg-white"
                            }`}
                          >
                            {/* Interlocking Jigsaw SVG with Dotted Connecting Borders */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              {/* Dotted border outline with irregular interlocking knob */}
                              <path
                                d={
                                  // Irregular puzzle piece shape with classic jigsaw tab
                                  `M 0,0 
                                   H ${tile.top === 1 ? '38 C 38,15 62,15 62,0' : tile.top === -1 ? '38 C 38,-15 62,-15 62,0' : '50'} H 100 
                                   V ${tile.right === 1 ? '38 C 115,38 115,62 100,62' : tile.right === -1 ? '85,38 85,62 100,62' : '50'} V 100 
                                   H ${tile.bottom === 1 ? '62 C 62,115 38,115 38,100' : tile.bottom === -1 ? '62,85 38,85 38,100' : '50'} H 0 
                                   V ${tile.left === 1 ? '62 C -15,62 -15,38 0,38' : tile.left === -1 ? '15,62 15,38 0,38' : '50'} Z`
                                }
                                fill={isUnlocked ? "none" : "#FFFFFF"}
                                stroke="#A0ABC0"
                                strokeWidth="1.8"
                                strokeDasharray="3 3"
                              />
                            </svg>

                            {!isUnlocked ? (
                              <div className="relative z-10 flex flex-col items-center justify-center text-center select-none p-1">
                                <Lock className="w-3.5 h-3.5 text-[#7E89A4] mb-0.5" />
                                <span className="text-[10px] font-bold text-[#7E89A4]">
                                  {tile.id + 1}
                                </span>
                              </div>
                            ) : (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#003B87] text-white flex items-center justify-center shadow-xs z-10">
                                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[#7E89A4]">
                      {isPuzzleComplete ? "All 9 pieces complete!" : "Unlock pieces below"}
                    </span>
                    {isPuzzleComplete && (
                      <button
                        onClick={() => setIsFlipped(true)}
                        className="py-1.5 px-3 rounded-lg bg-[#003B87] text-white font-bold text-xs shadow-xs hover:bg-[#051D45]"
                      >
                        Flip to Offers ↷
                      </button>
                    )}
                  </div>
                </div>

                {/* ---------------- BACK: REVEALED OFFERS CARD ---------------- */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#003B87] via-[#051D45] to-[#0A192F] text-white rounded-3xl p-6 border border-white/20 shadow-2xl backface-hidden rotate-y-180 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-white tracking-tight">
                        Exclusive Dining Offers
                      </h3>
                      <button
                        onClick={() => setIsFlipped(false)}
                        className="text-xs text-blue-200 hover:text-white"
                      >
                        ↶ View Crest
                      </button>
                    </div>

                    <p className="text-xs text-blue-100 leading-relaxed">
                      All 9 pieces collected! Choose your guaranteed reward from our kitchen:
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">100% Free Artisan Dessert</div>
                          <div className="text-[10px] text-blue-200">Tahitian Vanilla Soufflé or Chocolate Agnolotti</div>
                        </div>
                        <span className="text-xs font-bold text-amber-300">
                          FREE
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">25% Off Entire Table Check</div>
                          <div className="text-[10px] text-blue-200">Valid on any dinner or terrace reservation</div>
                        </div>
                        <span className="text-xs font-bold text-amber-300">
                          25% OFF
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => setActiveTab("draw")}
                      className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#051D45] text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Select Your Reward in Lucky Draw</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions to Collect Pieces (No eyebrow badges) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-[#051D45]">
                  How to Unlock Pieces
                </h3>
                {!isPuzzleComplete && (
                  <button
                    onClick={handleUnlockRemainingAll}
                    className="text-[11px] font-semibold text-[#003B87] hover:underline"
                  >
                    Quick Unlock All
                  </button>
                )}
              </div>

              {/* Action 1: Install App */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#003B87] flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#051D45]">Save App to Screen</h4>
                    <p className="text-[11px] text-[#7E89A4] mt-0.5">
                      Fast contactless access to Table & Thyme.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleInstallApp}
                  disabled={collectedPieces.includes(1)}
                  className="py-1.5 px-3 rounded-lg bg-[#003B87] disabled:bg-[#F1F3F7] disabled:text-[#7E89A4] text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(1) ? "Claimed" : "Install"}
                </button>
              </div>

              {/* Action 2: Share Feedback */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquareQuote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#051D45]">Culinary Notes & Rating</h4>
                    <p className="text-[11px] text-[#7E89A4] mt-0.5">
                      Share your thoughts on the Farmhouse Bowl.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  disabled={collectedPieces.includes(2) && collectedPieces.includes(3)}
                  className="py-1.5 px-3 rounded-lg bg-[#003B87] disabled:bg-[#F1F3F7] disabled:text-[#7E89A4] text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(2) ? "Reviewed" : "Review"}
                </button>
              </div>

              {/* Action 3: Table Dining & Terrace Actions */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#051D45]">Return Visit Check</h4>
                    <p className="text-[11px] text-[#7E89A4] mt-0.5">
                      Terrace table check & sommelier pairing.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => unlockPieceById(6, "Return visit recorded! Piece Unlocked.")}
                  disabled={collectedPieces.includes(6)}
                  className="py-1.5 px-3 rounded-lg bg-[#003B87] disabled:bg-[#F1F3F7] disabled:text-[#7E89A4] text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(6) ? "Verified" : "Verify"}
                </button>
              </div>
            </div>

            {feedbackToast && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center border border-emerald-200">
                {feedbackToast}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. GRAND LUCKY DRAW VIEW (NO EYEBROWS)                   */}
        {/* ======================================================== */}
        {activeTab === "draw" && (
          <div className="p-6 space-y-4 bg-white">
            <div className="text-center pt-2">
              <h2 className="text-2xl font-extrabold text-[#051D45] tracking-tight">
                Dining Rewards
              </h2>
              <p className="text-xs text-[#7E89A4] mt-1 max-w-xs mx-auto leading-relaxed">
                Pick your preferred prize below. Drawing guarantees high priority for your choice.
              </p>
            </div>

            {wonPrize ? (
              <div className="p-6 rounded-3xl bg-white border border-[#E4E8EE] shadow-xl text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#051D45]">
                    {wonPrize.title}
                  </h3>
                  <p className="text-xs text-[#7E89A4] mt-1 leading-relaxed">
                    {wonPrize.description}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#003B87] text-white space-y-1.5 shadow-md">
                  <span className="text-[10px] text-blue-200 uppercase tracking-widest block font-medium">
                    Redemption Voucher Code
                  </span>
                  <code className="text-lg font-mono font-bold tracking-widest text-amber-300 block select-all">
                    {voucherCode}
                  </code>
                  <p className="text-[11px] text-blue-100">
                    Show this code to your waiter or cashier to redeem.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("menu")}
                  className="w-full py-3 rounded-xl bg-[#051D45] text-white text-xs font-bold hover:bg-[#003B87] transition-colors"
                >
                  Return to Menu
                </button>
              </div>
            ) : !isPuzzleComplete ? (
              <div className="p-6 rounded-3xl bg-white border border-[#E4E8EE] text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#F1F3F7] text-[#7E89A4] flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#051D45]">Draw Currently Locked</h3>
                <p className="text-xs text-[#7E89A4] max-w-xs mx-auto leading-relaxed">
                  You have collected {collectedPieces.length} of 9 crest pieces. Finish assembling the 3x3 Jigsaw to enter the draw!
                </p>
                <button
                  onClick={() => setActiveTab("puzzle")}
                  className="py-2.5 px-5 rounded-xl bg-[#003B87] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <span>Complete Jigsaw</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2.5">
                  {MOCK_PRIZES.map((prize) => {
                    const isSelected = preferredPrizeId === prize.id;
                    return (
                      <button
                        key={prize.id}
                        onClick={() => setPreferredPrizeId(prize.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-[#003B87] bg-blue-50/50 shadow-sm ring-1 ring-[#003B87]"
                            : "border-[#E4E8EE] bg-white hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#051D45]">
                              {prize.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7E89A4] mt-0.5">
                            {prize.description}
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-[#003B87] bg-[#003B87] text-white"
                              : "border-[#D5DAE5]"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={isDrawing}
                  onClick={handleExecuteDraw}
                  className="w-full py-3.5 rounded-2xl bg-[#003B87] hover:bg-[#051D45] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isDrawing ? "animate-spin" : ""}`} />
                  <span>{isDrawing ? "Drawing Your Reward..." : "Confirm & Execute Lucky Draw"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* BOTTOM TAB BAR                                           */}
        {/* ======================================================== */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E8EE] shadow-lg">
          <div className="max-w-[430px] mx-auto grid grid-cols-4 px-2 py-2">
            <button
              onClick={() => setActiveTab("menu")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "menu" ? "text-[#003B87] font-bold" : "text-[#7E89A4] hover:text-[#051D45]"
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Menu</span>
            </button>

            <button
              onClick={() => setActiveTab("order")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "order" ? "text-[#003B87] font-bold" : "text-[#7E89A4] hover:text-[#051D45]"
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Order</span>
            </button>

            <button
              onClick={() => setActiveTab("puzzle")}
              className={`flex flex-col items-center justify-center py-1 relative transition-colors ${
                activeTab === "puzzle" ? "text-[#003B87] font-bold" : "text-[#7E89A4] hover:text-[#051D45]"
              }`}
            >
              <Puzzle className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Jigsaw</span>
              {collectedPieces.length > 0 && (
                <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("draw")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "draw" ? "text-[#003B87] font-bold" : "text-[#7E89A4] hover:text-[#051D45]"
              }`}
            >
              <Gift className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Offers</span>
            </button>
          </div>
        </nav>

        {/* Dish Detail Modal */}
        {selectedItemDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b border-[#E4E8EE] pb-3">
                <div>
                  <h3 className="text-xl font-bold text-[#051D45]">
                    {selectedItemDetail.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItemDetail(null)}
                  className="w-8 h-8 rounded-full bg-[#F1F3F7] text-[#7E89A4] flex items-center justify-center hover:bg-[#D5DAE5]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#7E89A4] leading-relaxed">
                {selectedItemDetail.description}
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-black text-[#051D45]">
                  ₹{selectedItemDetail.price}
                </span>

                <button
                  onClick={() => {
                    addItem(selectedItemDetail);
                    setSelectedItemDetail(null);
                  }}
                  className="py-2.5 px-6 rounded-full bg-[#003B87] hover:bg-[#051D45] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add to Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b border-[#E4E8EE] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#051D45]">Culinary Feedback</h3>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-[#7E89A4] hover:text-[#051D45] text-xs font-semibold px-2 py-1"
                >
                  Close
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-[#051D45] block mb-1.5">
                  Culinary Experience Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFeedbackRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= feedbackRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-[#D5DAE5]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#051D45] block mb-1">
                  Your Notes to the Chef
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="How was the Farmhouse Bowl or Pasta Alfredo flavor balance?"
                  className="w-full text-xs p-3 rounded-xl border border-[#D5DAE5] bg-[#F8F9FA] focus:outline-none focus:border-[#003B87]"
                />
              </div>

              <button
                disabled={feedbackText.trim().length === 0}
                onClick={handleSubmitFeedback}
                className="w-full py-3 rounded-xl bg-[#003B87] hover:bg-[#051D45] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}