"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Puzzle,
  Download,
  MessageSquareQuote,
  Sparkles,
  CheckCircle2,
  Lock,
  Gift,
  ArrowRight,
  Star,
  Info,
  Clock,
  Send,
} from "lucide-react";
import confetti from "canvas-confetti";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";

interface CampaignInfo {
  id: string;
  title: string;
  description: string;
  totalPieces: number;
  minOrderAmount: number;
  rewardDescription: string;
}

interface Piece {
  pieceIndex: number;
  reason: string;
  unlockedAt: string;
}

export default function JigsawPuzzlePage() {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [collectedIndices, setCollectedIndices] = useState<number[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Earning rule modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [pwaMessage, setPwaMessage] = useState("");

  useEffect(() => {
    // 1. Recover or generate customer ID
    let storedId = localStorage.getItem("yourfood_customer_id");
    if (!storedId) {
      storedId = `guest_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("yourfood_customer_id", storedId);
    }
    setCustomerId(storedId);

    // 2. Listen for native PWA beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setPwaInstalled(true);
    }

    loadPuzzleState(storedId);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function loadPuzzleState(cId: string) {
    try {
      const res = await fetch(`/api/loyalty/puzzle?customerId=${cId}`);
      const data = await res.json();
      if (data.success) {
        setCampaign(data.campaign);
        setCollectedIndices(data.collectedIndices || []);
        setPieces(data.pieces || []);
        setIsCompleted(data.isCompleted || false);

        if (data.isCompleted) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error("Failed to load puzzle state", err);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================================
  // RULE A: Install PWA to earn 1 Piece
  // =========================================================================
  async function handleInstallPwa() {
    setPwaMessage("");
    if (!customerId) return;

    if (pwaPrompt) {
      pwaPrompt.prompt();
      const choice = await pwaPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setPwaInstalled(true);
        claimPwaPiece(true);
      }
    } else {
      // Browser fallback (iOS Safari or desktop without native event)
      claimPwaPiece(false);
    }
  }

  async function claimPwaPiece(verified: boolean) {
    try {
      const res = await fetch("/api/loyalty/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pwa_install",
          customerId,
          browserVerified: verified,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwaMessage(data.message);
        loadPuzzleState(customerId!);
      } else {
        setPwaMessage(data.error || "Piece already claimed.");
      }
    } catch {
      setPwaMessage("Could not verify installation right now.");
    }
  }

  // =========================================================================
  // RULE B: Submit Private Comment to earn 2 Pieces
  // =========================================================================
  async function handleSubmitFeedback() {
    if (!customerId || !feedbackText.trim()) return;
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackSuccess("");

    try {
      const res = await fetch("/api/loyalty/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment_submission",
          customerId,
          commentText: feedbackText,
          rating: feedbackRating,
          serviceAspects: ["cuisine_quality", "service_speed"],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackSuccess(data.message);
        loadPuzzleState(customerId);
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackSuccess("");
          setFeedbackText("");
        }, 1500);
      } else {
        setFeedbackError(data.error || "Could not submit feedback.");
      }
    } catch {
      setFeedbackError("Network error submitting feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  // 4 Jigsaw Crest Piece Definitions
  const puzzleSegments = [
    { index: 0, title: "The Royal Fleur", desc: "Dining Order Initiation", icon: "⚜️" },
    { index: 1, title: "The Sovereign Key", desc: "Mobile App Installation", icon: "🗝️" },
    { index: 2, title: "The Connoisseur Quill", desc: "Culinary Private Feedback", icon: "🪶" },
    { index: 3, title: "The Heritage Seal", desc: "Staff Verified Return Visit", icon: "👑" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-md mx-auto">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Assembling Jigsaw Crest...</p>
        </div>
      </div>
    );
  }

  const collectedCount = collectedIndices.length;
  const progressPercent = Math.min(100, Math.round((collectedCount / 4) * 100));

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      <MobileHeader title="Jigsaw Puzzle Quest" subtitle="Collect pieces to unlock Grand Draw" />

      <main className="p-4 space-y-4">
        {/* Completion Announcement Banner */}
        {isCompleted ? (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-primary-600 to-primary-800 text-white shadow-card text-center space-y-3 animate-in zoom-in-95">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gourmet Crest Completed!</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">The Crest is Whole</h2>
            <p className="text-xs text-amber-100 max-w-xs mx-auto leading-relaxed">
              You have assembled all 4 pieces! Step into the Grand Lucky Draw to select your preferred dining reward.
            </p>
            <Link
              href="/draw"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-white text-neutral-900 font-bold text-xs shadow-md hover:bg-neutral-50 transition-transform active:scale-95"
            >
              <Gift className="w-4 h-4 text-primary-600" />
              <span>Enter Lucky Draw & Choose Prize</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          /* Progress Bar */
          <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800">Crest Assembly Progress</span>
              <span className="font-bold text-primary-700">{collectedCount} of 4 Pieces</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 4-Piece Interactive Jigsaw Matrix */}
        <div className="p-5 rounded-3xl bg-surface border border-neutral-200/80 shadow-card">
          <div className="text-center mb-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Gourmet Crest Jigsaw
            </h3>
            <p className="text-xs text-neutral-600 font-medium mt-0.5">
              Tap any unlocked piece to view its origin
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-w-[280px] mx-auto">
            {puzzleSegments.map((segment) => {
              const isCollected = collectedIndices.includes(segment.index);
              return (
                <div
                  key={segment.index}
                  className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all ${
                    isCollected
                      ? "border-primary-500/80 bg-gradient-to-br from-primary-50 to-rose-100/60 shadow-sm text-primary-950 scale-[1.02]"
                      : "border-dashed border-neutral-300 bg-neutral-50/50 text-neutral-400"
                  }`}
                >
                  {isCollected ? (
                    <>
                      <span className="text-3xl mb-1 filter drop-shadow">{segment.icon}</span>
                      <span className="text-[11px] font-bold tracking-tight">{segment.title}</span>
                      <span className="text-[9px] text-primary-700 font-medium">Piece #{segment.index + 1}</span>
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-neutral-300 mb-1" />
                      <span className="text-[10px] font-medium text-neutral-400">Piece #{segment.index + 1}</span>
                      <span className="text-[9px] text-neutral-400 mt-0.5">Locked</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Unobtrusive Puzzle Earning Actions (No Nudging) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <h3 className="text-xs font-semibold text-neutral-700">How to Collect Pieces</h3>
          </div>

          {/* Rule A: Install App (1 Piece) */}
          <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-neutral-900">Install Web App</h4>
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.2 rounded">
                    +1 Piece
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Save to your home screen for instant contactless access.
                </p>
                {pwaMessage && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">{pwaMessage}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium shrink-0 active:scale-95 transition-all"
            >
              Install
            </button>
          </div>

          {/* Rule B: Private Feedback (2 Pieces) */}
          <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquareQuote className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-neutral-900">Share Private Feedback</h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                    +2 Pieces
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Private constructive thoughts to our chef brigade.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shrink-0 active:scale-95 transition-all"
            >
              Review
            </button>
          </div>

          {/* Rule C: Return Visit & Staff Verification (1 Piece) */}
          <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-neutral-900">Qualifying Return Visit</h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                    +1 Piece
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Spend $20+ on your next visit and request staff verification.
                </p>
              </div>
            </div>

            <Link
              href="/staff"
              className="py-1.5 px-2.5 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-medium shrink-0 hover:bg-neutral-50"
            >
              Staff portal
            </Link>
          </div>
        </div>

        {/* Lucky Draw Trigger when complete */}
        <div className="pt-2">
          {isCompleted ? (
            <Link
              href="/draw"
              className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Gift className="w-4 h-4" />
              <span>Open Grand Lucky Draw & Choose Preferred Prize</span>
            </Link>
          ) : (
            <div className="p-3 rounded-xl bg-neutral-100 text-center text-xs text-neutral-500">
              Collect all 4 pieces to unlock the Grand Lucky Draw.
            </div>
          )}
        </div>
      </main>

      {/* Private Feedback Modal (Rule B) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-5 shadow-float space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Private Dining Feedback</h3>
                <p className="text-[11px] text-neutral-500">
                  Shared directly with restaurant management • Awards exactly 2 pieces
                </p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xs font-semibold px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* Star Rating Selection */}
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                Overall Impression
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

            {/* Comment Box */}
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Your Thoughts (min 5 characters)
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="How was the Truffled Burrata, steak doneness, or cocktail ambiance?"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:border-primary-500"
              />
            </div>

            {feedbackError && (
              <p className="text-xs text-red-500 font-medium">{feedbackError}</p>
            )}
            {feedbackSuccess && (
              <p className="text-xs text-emerald-600 font-medium">{feedbackSuccess}</p>
            )}

            <button
              disabled={feedbackLoading || feedbackText.trim().length < 5}
              onClick={handleSubmitFeedback}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{feedbackLoading ? "Submitting..." : "Submit & Claim 2 Pieces"}</span>
            </button>
          </div>
        </div>
      )}

      <MobileTabBar />
    </div>
  );
}