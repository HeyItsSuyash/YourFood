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
    setFeedbackToast("Thank you for your thoughts! Jigsaw Piece unlocked.");

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
    <div className="relative min-h-screen bg-[#F0F2F5] text-[#0A192F] flex flex-col items-center font-sans">
      {/* 
        Mobile Device Screen Container:
        Seamless, flat background (#F8F9FA) exactly like the image with NO white card overlay!
      */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8F9FA] relative flex flex-col pb-24 overflow-x-hidden shadow-2xl">
        
        {/* ======================================================== */}
        {/* 1. MENU VIEW: STRICTLY MATCHING Table & Thyme Food Menu  */}
        {/* ======================================================== */}
        {activeTab === "menu" && (
          <div className="w-full flex flex-col">
            {/* Header: Pure artwork from image without any phone bezel */}
            <div className="relative w-full aspect-[780/870] overflow-hidden bg-[#003B87]">
              <Image
                src="/menu-clean-bg.png"
                alt="Table & Thyme Food Menu Artwork"
                fill
                priority
                className="object-cover object-top select-none pointer-events-none"
              />

              {/* Status bar */}
              <div className="absolute top-0 left-0 right-0 pt-3.5 px-7 flex justify-between items-center text-xs text-white font-semibold pointer-events-none z-10 tracking-tight">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5 items-end h-2.5">
                    <span className="w-0.5 h-1 bg-white rounded-full inline-block" />
                    <span className="w-0.5 h-1.5 bg-white rounded-full inline-block" />
                    <span className="w-0.5 h-2 bg-white rounded-full inline-block" />
                    <span className="w-0.5 h-2.5 bg-white rounded-full inline-block" />
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full border border-white inline-block" />
                </div>
              </div>
            </div>

            {/* 
              FLAT SEAMLESS MENU LIST:
              No white card, no border radius cutoff, no card elevation!
              Flows directly on the background with the exact same typography & colors as in the image.
            */}
            <div className="px-7 pt-4 pb-20 bg-[#F8F9FA]">
              {/* Section Heading: "Food" matching the image font size & color */}
              <div className="mb-5">
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
                      {/* Left: Dish Title & Description */}
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

                      {/* Right: Price & Chevron > & Add Controls */}
                      <div className="flex flex-col items-end shrink-0 pt-0.5">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={() => setSelectedItemDetail(item)}
                        >
                          <span className="text-[17px] font-bold text-[#051D45] tracking-tight">
                            ₹{item.price}
                          </span>
                          {/* Exact Chevron Arrow from Image */}
                          <ChevronRight className="w-4 h-4 text-[#051D45] stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                        </div>

                        {/* Interactive Add to Order Button */}
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
                            <div className="flex items-center gap-2 bg-[#E9ECF2] rounded-full px-2 py-0.5 border border-[#D5DAE5]">
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

            {/* Floating Order Summary Drawer */}
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
        {/* 2. ORDER CONFIRMATION VIEW (THEME CONSISTENT)             */}
        {/* ======================================================== */}
        {activeTab === "order" && (
          <div className="p-6 space-y-4">
            {/* Header matching royal blue brand */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E8EE]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#003B87]">
                  Table & Thyme Kitchen
                </span>
                <h1 className="text-xl font-bold text-[#051D45]">Order Status</h1>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#E9ECF2] text-[#051D45]">
                {currentOrder?.orderNumber || "TT-2049"}
              </span>
            </div>

            {/* Exact Required Delivery Message */}
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

            {/* Jigsaw Incentive Teaser Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#003B87] to-[#051D45] text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-white/20 text-white">
                    <Puzzle className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Connoisseur Crest
                  </span>
                </div>
                <span className="text-[11px] text-blue-100 font-medium">
                  {collectedPieces.length}/4 Assembled
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Jigsaw Piece #1 Unlocked!
                </h3>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Your artisan dining order unlocked the Royal Fleur piece. Complete all 4 pieces to enter the Grand Lucky Draw.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("puzzle")}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#003B87] hover:bg-neutral-100 text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>View Jigsaw Puzzle Quest</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Order Items Receipt */}
            <div className="p-5 rounded-3xl bg-white border border-[#E4E8EE] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#051D45] uppercase tracking-wider border-b border-[#E4E8EE] pb-2.5">
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
        {/* 3. JIGSAW PUZZLE QUEST VIEW (THEME CONSISTENT)           */}
        {/* ======================================================== */}
        {activeTab === "puzzle" && (
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#003B87] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Loyalty Crest Quest
              </span>
              <h2 className="text-2xl font-extrabold text-[#051D45] mt-2 tracking-tight">
                The Connoisseur Jigsaw
              </h2>
              <p className="text-xs text-[#7E89A4] mt-1 max-w-xs mx-auto leading-relaxed">
                Assemble all 4 authentic crest pieces to unlock the Grand Lucky Draw.
              </p>
            </div>

            {/* Completed Banner */}
            {isPuzzleComplete && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center space-y-2 animate-in zoom-in-95 shadow-md">
                <div className="flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>All 4 Pieces Collected!</span>
                </div>
                <p className="text-xs text-amber-100">
                  Your crest is whole. Proceed to select your guaranteed dining reward.
                </p>
                <button
                  onClick={() => setActiveTab("draw")}
                  className="py-2 px-5 rounded-xl bg-white text-[#051D45] font-bold text-xs shadow-md inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Open Lucky Draw</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* 4-Piece Interactive Jigsaw Matrix */}
            <div className="p-5 rounded-3xl bg-white border border-[#E4E8EE] shadow-sm">
              <div className="grid grid-cols-2 gap-3 max-w-[270px] mx-auto">
                {puzzleSegments.map((segment) => {
                  const isCollected = collectedPieces.includes(segment.index);
                  return (
                    <div
                      key={segment.index}
                      className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all ${
                        isCollected
                          ? "border-[#003B87] bg-blue-50/40 text-[#051D45] shadow-xs scale-[1.02]"
                          : "border-dashed border-[#D5DAE5] bg-[#F8F9FA] text-[#7E89A4]"
                      }`}
                    >
                      {isCollected ? (
                        <>
                          <span className="text-3xl mb-1">{segment.icon}</span>
                          <span className="text-[11px] font-bold tracking-tight">
                            {segment.title}
                          </span>
                          <span className="text-[9px] text-[#003B87] font-semibold mt-0.5">
                            Piece #{segment.index + 1}
                          </span>
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#003B87] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 text-[#B0B9C9] mb-1" />
                          <span className="text-[10px] font-medium text-[#7E89A4]">
                            Piece #{segment.index + 1}
                          </span>
                          <span className="text-[9px] text-[#B0B9C9] mt-0.5">Locked</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions to Collect Remaining Pieces */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#051D45] px-1 uppercase tracking-wider">
                How to Collect Pieces
              </h3>

              {/* Action 1: Install PWA */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#003B87] flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#051D45]">Save App to Screen</h4>
                      <span className="text-[9px] font-bold text-[#003B87] bg-blue-50 px-1.5 py-0.2 rounded">
                        Piece #2
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7E89A4] mt-0.5">
                      Quick contactless access to Table & Thyme.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleInstallApp}
                  disabled={hasInstalledPwa || collectedPieces.includes(1)}
                  className="py-1.5 px-3 rounded-lg bg-[#003B87] disabled:bg-[#E9ECF2] disabled:text-[#7E89A4] text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(1) ? "Claimed" : "Install"}
                </button>
              </div>

              {/* Action 2: Share Private Feedback */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquareQuote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#051D45]">Culinary Feedback</h4>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                        Piece #3
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7E89A4] mt-0.5">
                      Private suggestions directly to our head chef.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  disabled={hasSubmittedFeedback || collectedPieces.includes(2)}
                  className="py-1.5 px-3 rounded-lg bg-[#003B87] disabled:bg-[#E9ECF2] disabled:text-[#7E89A4] text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(2) ? "Reviewed" : "Review"}
                </button>
              </div>

              {/* Action 3: Return Visit Verification */}
              <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#051D45]">Return Visit Check</h4>
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                        Piece #4
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7E89A4] mt-0.5">
                      Table validation on your second dining trip.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleVerifyReturnVisit}
                  disabled={hasReturnVisitVerified || collectedPieces.includes(3)}
                  className="py-1.5 px-3 rounded-lg bg-[#003B87] disabled:bg-[#E9ECF2] disabled:text-[#7E89A4] text-white text-xs font-semibold shrink-0"
                >
                  {collectedPieces.includes(3) ? "Verified" : "Verify"}
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
        {/* 4. GRAND LUCKY DRAW & REWARDS VIEW (THEME CONSISTENT)     */}
        {/* ======================================================== */}
        {activeTab === "draw" && (
          <div className="p-6 space-y-4">
            <div className="text-center pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#003B87] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Grand Connoisseur Draw
              </span>
              <h2 className="text-2xl font-extrabold text-[#051D45] mt-2 tracking-tight">
                Preferred Dining Reward
              </h2>
              <p className="text-xs text-[#7E89A4] mt-1 max-w-xs mx-auto leading-relaxed">
                Pick your preferred prize below. Drawing guarantees high priority for your choice.
              </p>
            </div>

            {wonPrize ? (
              /* Reward Reveal Voucher Card */
              <div className="p-6 rounded-3xl bg-white border border-[#E4E8EE] shadow-xl text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                    Prize Unlocked!
                  </span>
                  <h3 className="text-lg font-bold text-[#051D45] mt-2">
                    {wonPrize.title}
                  </h3>
                  <p className="text-xs text-[#7E89A4] mt-1 leading-relaxed">
                    {wonPrize.description}
                  </p>
                </div>

                {/* Voucher code box */}
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
              /* Locked state */
              <div className="p-6 rounded-3xl bg-white border border-[#E4E8EE] text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#E9ECF2] text-[#7E89A4] flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#051D45]">Draw Currently Locked</h3>
                <p className="text-xs text-[#7E89A4] max-w-xs mx-auto leading-relaxed">
                  You have collected {collectedPieces.length} of 4 crest pieces. Finish assembling the Connoisseur Jigsaw to enter the draw!
                </p>
                <button
                  onClick={() => setActiveTab("puzzle")}
                  className="py-2.5 px-5 rounded-xl bg-[#003B87] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <span>Complete Puzzle</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              /* Active Draw Selection */
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
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                              {prize.discountText}
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
        {/* BOTTOM TAB NAVIGATION (THEME CONSISTENT)                 */}
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
                <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("draw")}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === "draw" ? "text-[#003B87] font-bold" : "text-[#7E89A4] hover:text-[#051D45]"
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
              <div className="flex items-center justify-between border-b border-[#E4E8EE] pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#003B87] uppercase tracking-widest">
                    Table & Thyme Kitchen
                  </span>
                  <h3 className="text-xl font-bold text-[#051D45]">
                    {selectedItemDetail.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItemDetail(null)}
                  className="w-8 h-8 rounded-full bg-[#E9ECF2] text-[#7E89A4] flex items-center justify-center hover:bg-[#D5DAE5]"
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
                  <h3 className="text-sm font-bold text-[#051D45]">Private Culinary Feedback</h3>
                  <p className="text-[11px] text-[#7E89A4]">
                    Awards +1 Jigsaw Crest Piece
                  </p>
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
                <span>Submit & Claim Jigsaw Piece</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}