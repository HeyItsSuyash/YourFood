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

export default function GourmetExperiencePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);

  // Flow State
  const [currentOrder, setCurrentOrder] = useState<PlacedOrder | null>(null);
  const [collectedPieces, setCollectedPieces] = useState<number[]>([0]); // Starts with 0 (Order Initiation) or unlocked upon ordering
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [hasInstalledPwa, setHasInstalledPwa] = useState(false);
  const [hasReturnVisitVerified, setHasReturnVisitVerified] = useState(false);

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
    // Restore from localStorage if present
    const savedPieces = localStorage.getItem("tablethyme_pieces");
    if (savedPieces) {
      try {
        setCollectedPieces(JSON.parse(savedPieces));
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
  }, []);

  function savePieces(pieces: number[]) {
    setCollectedPieces(pieces);
    localStorage.setItem("tablethyme_pieces", JSON.stringify(pieces));
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
  const taxAmount = Math.round(subtotalAmount * 0.05); // 5% GST
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

    // Unlock Piece 0 (Dining Order Initiation)
    if (!collectedPieces.includes(0)) {
      const updated = Array.from(new Set([...collectedPieces, 0]));
      savePieces(updated);
    }

    setActiveTab("order");
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  }

  // Puzzle Actions
  function handleInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === "accepted") {
          setHasInstalledPwa(true);
        }
      });
    }
    setHasInstalledPwa(true);
    if (!collectedPieces.includes(1)) {
      const updated = Array.from(new Set([...collectedPieces, 1]));
      savePieces(updated);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } });
    }
  }

  function handleSubmitFeedback() {
    if (!feedbackText.trim()) return;
    setHasSubmittedFeedback(true);
    setShowFeedbackModal(false);
    setFeedbackToast("Thank you for your thoughts! 2 Pieces unlocked.");

    // Rule: Feedback gives piece 2
    const updated = [...collectedPieces];
    if (!updated.includes(2)) updated.push(2);
    savePieces(updated);

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setFeedbackToast(""), 4000);
  }

  function handleVerifyReturnVisit() {
    setHasReturnVisitVerified(true);
    if (!collectedPieces.includes(3)) {
      const updated = Array.from(new Set([...collectedPieces, 3]));
      savePieces(updated);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 } });
    }
  }

  // Lucky Draw Execution
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

  const isPuzzleComplete = collectedPieces.length >= 4;

  const puzzleSegments = [
    { index: 0, title: "The Royal Fleur", rule: "Dining Order Initiation", icon: "⚜️" },
    { index: 1, title: "The Sovereign Key", rule: "Install Web App (+1 Piece)", icon: "🗝️" },
    { index: 2, title: "The Connoisseur Quill", rule: "Private Culinary Feedback (+1 Piece)", icon: "🪶" },
    { index: 3, title: "The Heritage Seal", rule: "Staff Verified Return Visit (+1 Piece)", icon: "👑" },
  ];

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-[#0D1B2A] flex flex-col items-center">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl relative flex flex-col pb-24 overflow-x-hidden">
        
        {/* ======================================================== */}
        {/* 1. MENU VIEW (MATCHING image.png PIXEL-PERFECTLY)        */}
        {/* ======================================================== */}
        {activeTab === "menu" && (
          <div className="w-full flex flex-col">
            {/* Header Image matching image.png visual curve & bowls */}
            <div className="relative w-full aspect-[9/10] overflow-hidden bg-[#0A3275]">
              <Image
                src="/menu-bg.png"
                alt="Table & Thyme Food Menu"
                fill
                priority
                className="object-cover object-top select-none pointer-events-none"
              />

              {/* Status Bar simulation on mockup */}
              <div className="absolute top-0 left-0 right-0 pt-3 px-6 flex justify-between items-center text-xs text-white/90 font-semibold pointer-events-none z-10">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/80 inline-block" />
                  <span className="text-[10px] font-bold">5G</span>
                </div>
              </div>
            </div>

            {/* Menu Content matching image.png typography */}
            <div className="px-6 -mt-10 relative z-20 pb-20 bg-white rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.03)]">
              {/* Header Title: "Food" */}
              <div className="pt-6 mb-3 flex items-center justify-between">
                <h2 className="text-3xl font-extrabold text-[#0D1B2A] tracking-tight">
                  Food
                </h2>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                  Chef&apos;s Specials
                </span>
              </div>

              {/* Menu Items List */}
              <div className="divide-y divide-neutral-100">
                {MOCK_MENU.map((item) => {
                  const qty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="py-4 flex items-start justify-between gap-4 group transition-colors hover:bg-neutral-50/70 rounded-xl px-2 -mx-2"
                    >
                      {/* Left: Dish Information */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedItemDetail(item)}
                      >
                        <h3 className="text-base font-bold text-[#0D1B2A] group-hover:text-primary-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed max-w-[230px]">
                          {item.description}
                        </p>
                      </div>

                      {/* Right: Price & Quantity Controls */}
                      <div className="flex flex-col items-end shrink-0 pt-0.5">
                        <div
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={() => setSelectedItemDetail(item)}
                        >
                          <span className="text-base font-bold text-[#0D1B2A]">
                            ₹{item.price}
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                        </div>

                        {/* Interactive Add Button */}
                        <div className="mt-2.5">
                          {qty === 0 ? (
                            <button
                              onClick={() => addItem(item)}
                              className="px-3.5 py-1 rounded-full bg-[#0D1B2A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
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

            {/* Floating Order Tray */}
            {totalCartCount > 0 && (
              <div className="fixed bottom-20 left-0 right-0 z-30 max-w-[430px] mx-auto px-4">
                <div className="p-4 rounded-2xl bg-[#0D1B2A] text-white shadow-2xl flex items-center justify-between gap-4 border border-white/10 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-300 block font-medium">
                        {totalCartCount} item(s) • Table 07
                      </span>
                      <span className="text-base font-bold text-white">
                        ₹{grandTotal} <span className="text-[10px] text-neutral-400 font-normal">(incl. tax)</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="py-2.5 px-5 rounded-xl bg-white hover:bg-neutral-100 text-[#0D1B2A] font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                  >
                    <span>Place Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ORDER CONFIRMATION VIEW                               */}
        {/* ======================================================== */}
        {activeTab === "order" && (
          <div className="p-5 space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A3275]">
                Table & Thyme Kitchen
              </span>
              <span className="text-xs font-mono text-neutral-500">
                {currentOrder?.orderNumber || "TT-2049"}
              </span>
            </div>

            {/* Exact Required Delivery Message */}
            <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200/80 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-lg font-bold text-[#0D1B2A] tracking-tight">
                Thank you, your order will be delivered shortly.
              </h2>

              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Our kitchen brigade is currently preparing your handcrafted artisan dishes.
              </p>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-200/60 text-xs text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-semibold text-neutral-800">
                    {currentOrder?.tableNumber || "Table 07 (Garden Terrace)"}
                  </span>
                </div>
                <span className="text-neutral-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Est. ~12-15 min</span>
                </div>
              </div>
            </div>

            {/* Jigsaw Incentive Teaser Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0A3275] to-[#0D1B2A] text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-white/20 text-white">
                    <Puzzle className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Connoisseur Crest
                  </span>
                </div>
                <span className="text-[11px] text-white/80 font-medium">
                  {collectedPieces.length}/4 Assembled
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Jigsaw Piece #1 Unlocked!
                </h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Your artisan dining order unlocked the Royal Fleur piece. Complete all 4 pieces to enter the Grand Lucky Draw.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("puzzle")}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0D1B2A] hover:bg-neutral-100 text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>View Jigsaw Puzzle Quest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Order Items Receipt */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
                <Receipt className="w-4 h-4 text-neutral-400" />
                <span>Order Summary</span>
              </div>

              <div className="divide-y divide-neutral-100 text-xs">
                {(currentOrder?.items || [
                  { item: MOCK_MENU[0], quantity: 1 },
                  { item: MOCK_MENU[1], quantity: 1 },
                ]).map(({ item, quantity }) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <span className="font-medium text-neutral-800">
                      {quantity}x {item.name}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      ₹{item.price * quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>₹{currentOrder?.subtotal || 528}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>GST (5%)</span>
                  <span>₹{currentOrder?.tax || 26}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Service (5%)</span>
                  <span>₹{currentOrder?.serviceCharge || 26}</span>
                </div>
                <div className="flex justify-between text-neutral-900 font-bold text-sm pt-1 border-t border-neutral-100">
                  <span>Total Paid</span>
                  <span className="text-[#0A3275]">₹{currentOrder?.total || 580}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. JIGSAW PUZZLE VIEW                                    */}
        {/* ======================================================== */}
        {activeTab === "puzzle" && (
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A3275] bg-blue-50 px-3 py-1 rounded-full">
                Loyalty Crest Quest
              </span>
              <h2 className="text-xl font-bold text-[#0D1B2A] mt-2">
                The Connoisseur Jigsaw
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Assemble all 4 authentic crest pieces to unlock the Grand Lucky Draw.
              </p>
            </div>

            {/* Completed Banner */}
            {isPuzzleComplete && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center space-y-2 animate-in zoom-in-95">
                <div className="flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>All 4 Pieces Collected!</span>
                </div>
                <p className="text-xs text-amber-100">
                  Your crest is whole. Proceed to select your guaranteed dining reward.
                </p>
                <button
                  onClick={() => setActiveTab("draw")}
                  className="py-2 px-5 rounded-xl bg-white text-neutral-900 font-bold text-xs shadow-md inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Open Lucky Draw</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4-Piece Interactive Jigsaw Matrix */}
            <div className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200">
              <div className="grid grid-cols-2 gap-3 max-w-[260px] mx-auto">
                {puzzleSegments.map((segment) => {
                  const isCollected = collectedPieces.includes(segment.index);
                  return (
                    <div
                      key={segment.index}
                      className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all ${
                        isCollected
                          ? "border-[#0A3275] bg-white shadow-md text-[#0D1B2A] scale-[1.02]"
                          : "border-dashed border-neutral-300 bg-neutral-100/50 text-neutral-400"
                      }`}
                    >
                      {isCollected ? (
                        <>
                          <span className="text-3xl mb-1">{segment.icon}</span>
                          <span className="text-[11px] font-bold tracking-tight">
                            {segment.title}
                          </span>
                          <span className="text-[9px] text-[#0A3275] font-semibold">
                            Piece #{segment.index + 1}
                          </span>
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0A3275] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 text-neutral-300 mb-1" />
                          <span className="text-[10px] font-medium text-neutral-400">
                            Piece #{segment.index + 1}
                          </span>
                          <span className="text-[9px] text-neutral-400 mt-0.5">Locked</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions to Collect Remaining Pieces */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-neutral-700 px-1">
                How to Collect Pieces
              </h3>

              {/* Action 1: Install PWA */}
              <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A3275] flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-[#0D1B2A]">Save App to Screen</h4>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                        Piece #2
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Quick contactless access to Table & Thyme.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleInstallApp}
                  disabled={hasInstalledPwa || collectedPieces.includes(1)}
                  className="py-1.5 px-3 rounded-lg bg-[#0D1B2A] disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(1) ? "Claimed" : "Install"}
                </button>
              </div>

              {/* Action 2: Share Private Feedback */}
              <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquareQuote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-[#0D1B2A]">Culinary Feedback</h4>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                        Piece #3
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Private suggestions directly to our head chef.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  disabled={hasSubmittedFeedback || collectedPieces.includes(2)}
                  className="py-1.5 px-3 rounded-lg bg-[#0D1B2A] disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(2) ? "Reviewed" : "Review"}
                </button>
              </div>

              {/* Action 3: Return Visit Verification */}
              <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-[#0D1B2A]">Return Visit Check</h4>
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                        Piece #4
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Staff table validation on your second dining trip.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleVerifyReturnVisit}
                  disabled={hasReturnVisitVerified || collectedPieces.includes(3)}
                  className="py-1.5 px-3 rounded-lg bg-[#0D1B2A] disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(3) ? "Verified" : "Verify"}
                </button>
              </div>
            </div>

            {feedbackToast && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium text-center">
                {feedbackToast}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. GRAND LUCKY DRAW & REWARDS VIEW                       */}
        {/* ======================================================== */}
        {activeTab === "draw" && (
          <div className="p-5 space-y-4">
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                Grand Connoisseur Draw
              </span>
              <h2 className="text-xl font-bold text-[#0D1B2A] mt-2">
                Preferred Dining Reward
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Pick your preferred prize below. Drawing guarantees high priority for your choice.
              </p>
            </div>

            {wonPrize ? (
              /* Reward Reveal Voucher Card */
              <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xl text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                    Prize Unlocked!
                  </span>
                  <h3 className="text-lg font-bold text-[#0D1B2A] mt-2">
                    {wonPrize.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {wonPrize.description}
                  </p>
                </div>

                {/* Voucher code box */}
                <div className="p-4 rounded-2xl bg-[#0D1B2A] text-white space-y-1.5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-medium">
                    Redemption Voucher Code
                  </span>
                  <code className="text-lg font-mono font-bold tracking-widest text-amber-300 block select-all">
                    {voucherCode}
                  </code>
                  <p className="text-[10px] text-neutral-400">
                    Show this code to your waiter or cashier to redeem.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("menu")}
                  className="w-full py-3 rounded-xl bg-[#0A3275] text-white text-xs font-bold hover:bg-[#082554] transition-colors"
                >
                  Return to Menu
                </button>
              </div>
            ) : !isPuzzleComplete ? (
              /* Locked state */
              <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0D1B2A]">Draw Currently Locked</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  You have collected {collectedPieces.length} of 4 crest pieces. Finish assembling the Connoisseur Jigsaw to enter the draw!
                </p>
                <button
                  onClick={() => setActiveTab("puzzle")}
                  className="py-2.5 px-5 rounded-xl bg-[#0D1B2A] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <span>Complete Puzzle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Active Draw Selection */
              <div className="space-y-3">
                <div className="space-y-2">
                  {MOCK_PRIZES.map((prize) => {
                    const isSelected = preferredPrizeId === prize.id;
                    return (
                      <button
                        key={prize.id}
                        onClick={() => setPreferredPrizeId(prize.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-[#0A3275] bg-blue-50/50 shadow-sm ring-1 ring-[#0A3275]"
                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0D1B2A]">
                              {prize.title}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                              {prize.discountText}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {prize.description}
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-[#0A3275] bg-[#0A3275] text-white"
                              : "border-neutral-300"
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
                  className="w-full py-3.5 rounded-2xl bg-[#0A3275] hover:bg-[#082554] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isDrawing ? "animate-spin" : ""}`} />
                  <span>{isDrawing ? "Drawing Your Reward..." : "Confirm & Execute Lucky Draw"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* BOTTOM TAB NAVIGATION BAR                                */}
        {/* ======================================================== */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200">
          <div className="max-w-[430px] mx-auto grid grid-cols-4 px-2 py-2">
            <button
              onClick={() => setActiveTab("menu")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "menu" ? "text-[#0A3275] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Menu</span>
            </button>

            <button
              onClick={() => setActiveTab("order")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "order" ? "text-[#0A3275] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Order</span>
            </button>

            <button
              onClick={() => setActiveTab("puzzle")}
              className={`flex flex-col items-center justify-center py-1 relative transition-colors ${
                activeTab === "puzzle" ? "text-[#0A3275] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Puzzle className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Jigsaw</span>
              {collectedPieces.length > 0 && (
                <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("draw")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "draw" ? "text-[#0A3275] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Gift className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Rewards</span>
            </button>
          </div>
        </nav>

        {/* Dish Detail Modal */}
        {selectedItemDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#0A3275] uppercase tracking-widest">
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

              <p className="text-xs text-neutral-600 leading-relaxed">
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

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0D1B2A]">Private Culinary Feedback</h3>
                  <p className="text-[11px] text-neutral-500">
                    Awards +1 Jigsaw Crest Piece
                  </p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs font-semibold px-2 py-1"
                >
                  Close
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 block mb-1.5">
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
                            : "text-neutral-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  Your Notes to the Chef
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="How was the Farmhouse Bowl or Pasta Alfredo flavor balance?"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:border-[#0A3275]"
                />
              </div>

              <button
                disabled={feedbackText.trim().length === 0}
                onClick={handleSubmitFeedback}
                className="w-full py-3 rounded-xl bg-[#0A3275] hover:bg-[#082554] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit & Claim Jigsaw Piece</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}