"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gift,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  RotateCcw,
  Tag,
  Calendar,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";
import { formatCurrency } from "@/lib/utils";

interface Prize {
  id: string;
  title: string;
  description: string;
  category: string;
  rewardType: string;
  rewardValue: number;
  imageUrl?: string;
}

export default function LuckyDrawPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [preferredPrizeId, setPreferredPrizeId] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("yourfood_customer_id");
    setCustomerId(storedId);

    async function loadData() {
      try {
        // 1. Check puzzle completion
        if (storedId) {
          const pRes = await fetch(`/api/loyalty/puzzle?customerId=${storedId}`);
          const pData = await pRes.json();
          if (pData.success) {
            setIsCompleted(pData.isCompleted);
            if (pData.drawEntry && pData.rewards?.length > 0) {
              setDrawResult({
                isDuplicate: true,
                reward: pData.rewards[0],
                wonPrize: {
                  title: pData.rewards[0].title,
                  rewardValue: pData.rewards[0].rewardValue,
                },
              });
            }
          }
        }

        // 2. Load prizes
        const res = await fetch("/api/loyalty/prizes");
        const data = await res.json();
        if (data.success && data.prizes?.length > 0) {
          setPrizes(data.prizes);
          setPreferredPrizeId(data.prizes[0].id);
        }
      } catch (err) {
        console.error("Failed to load prizes", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleExecuteDraw() {
    if (!customerId || !preferredPrizeId) return;
    setDrawing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/loyalty/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          preferredPrizeId,
          drawMode: "preference_weighted",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to participate in draw.");
        return;
      }

      setDrawResult(data);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      setErrorMessage("Network issue participating in lucky draw.");
    } finally {
      setDrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-md mx-auto">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading Prize Catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      <MobileHeader title="Grand Lucky Draw" subtitle="Select your preferred dining prize" />

      <main className="p-4 space-y-4">
        {/* Draw Result & Voucher Screen */}
        {drawResult ? (
          <div className="p-6 rounded-3xl bg-surface border border-neutral-200/80 shadow-card text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                Grand Draw Reward Unlocked
              </span>
              <h2 className="text-lg font-bold text-neutral-900 mt-2">
                {drawResult.wonPrize?.title || drawResult.reward?.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {drawResult.isPreferredWon
                  ? "Congratulations! You won your selected preferred prize."
                  : "Drawn from our sommelier reserve prize pool for your completed crest."}
              </p>
            </div>

            {/* Redemption Voucher Code */}
            <div className="p-4 rounded-2xl bg-neutral-950 text-white space-y-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-medium">
                Voucher Redemption Code
              </span>
              <code className="text-base font-mono font-bold tracking-wider text-amber-400 block select-all">
                {drawResult.reward?.rewardCode || "YF-GOLD-8492"}
              </code>
              <p className="text-[11px] text-neutral-400">
                Present this code to your waiter or cashier on your next dining visit.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/r/latelier"
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Browse Restaurant Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : !isCompleted ? (
          /* Locked State if Puzzle Incomplete */
          <div className="p-6 rounded-3xl bg-surface border border-neutral-200/80 shadow-subtle text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Grand Draw Locked</h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Complete all 4 pieces of the Gourmet Crest in your quest to unlock preferred prize selection and participation.
              </p>
            </div>
            <Link
              href="/puzzle"
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-sm hover:bg-neutral-800 transition-colors"
            >
              <span>View Jigsaw Puzzle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          /* Active Draw Participation View */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-200/50 text-xs text-primary-950">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <Gift className="w-4 h-4 text-primary-700" />
                <span>Choose Preferred Prize Before Drawing</span>
              </div>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                Select your favorite prize below. The server applies our preference-weighted draw model with high priority to your choice.
              </p>
            </div>

            {/* Prize Catalogue List */}
            <div className="space-y-3">
              {prizes.map((prize) => {
                const isSelected = preferredPrizeId === prize.id;
                return (
                  <button
                    key={prize.id}
                    onClick={() => setPreferredPrizeId(prize.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex gap-3.5 ${
                      isSelected
                        ? "border-primary-600 bg-surface shadow-card ring-1 ring-primary-600"
                        : "border-neutral-200/80 bg-surface/70 hover:bg-surface shadow-subtle"
                    }`}
                  >
                    {prize.imageUrl && (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                        <Image
                          src={prize.imageUrl}
                          alt={prize.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-neutral-900">{prize.title}</h4>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-primary-600 bg-primary-600 text-white"
                              : "border-neutral-300"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        {prize.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              disabled={drawing || !preferredPrizeId}
              onClick={handleExecuteDraw}
              className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${drawing ? "animate-spin" : ""}`} />
              <span>{drawing ? "Drawing Your Reward..." : "Confirm Preference & Execute Draw"}</span>
            </button>
          </div>
        )}
      </main>

      <MobileTabBar />
    </div>
  );
}