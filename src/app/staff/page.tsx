"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertCircle, Search, ArrowRight, UserCheck } from "lucide-react";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";

export default function StaffVerificationPage() {
  const [orderId, setOrderId] = useState("");
  const [staffPasscode, setStaffPasscode] = useState("service123");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approvalDetails, setApprovalDetails] = useState<any>(null);

  async function handleVerifyVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setResultMessage(null);
    setErrorMessage(null);
    setApprovalDetails(null);

    try {
      const res = await fetch("/api/staff/verify-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          staffPasscode: staffPasscode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Verification failed.");
        return;
      }

      setResultMessage(data.message);
      setApprovalDetails(data);
    } catch {
      setErrorMessage("Network error during staff verification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      <MobileHeader title="Staff Visit Portal" subtitle="Rule C: Qualifying Return Visit Verification" />

      <main className="p-4 space-y-4">
        {/* Verification Overview */}
        <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Shopkeeper Action</span>
          </div>
          <h2 className="text-sm font-bold text-neutral-900">
            Verify Return Dining Visit ($20+ Min Spend)
          </h2>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            Customers earn 1 piece for eligible return visits. Enter the dining Order UUID or scan from guest receipt to verify threshold and grant the piece.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerifyVisit} className="p-5 rounded-3xl bg-surface border border-neutral-200/80 shadow-card space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Order ID (from customer receipt)
            </label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. b8f438a2-23c4-4a4b-9e32..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Staff Passcode / Key
            </label>
            <input
              type="password"
              value={staffPasscode}
              onChange={(e) => setStaffPasscode(e.target.value)}
              placeholder="Staff passcode (default: service123)"
              className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:outline-none focus:border-primary-500"
            />
            <span className="text-[10px] text-neutral-400 block mt-1">
              Pre-filled with demo waiter credentials (Elena Rostova / service123)
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resultMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? "Verifying..." : "Approve Qualifying Visit"}</span>
          </button>
        </form>

        {/* Verification Success Details */}
        {approvalDetails && (
          <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2 text-xs">
            <span className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">
              Verification Audit Recorded
            </span>
            <div className="flex justify-between text-neutral-300">
              <span>Piece Awarded:</span>
              <span className="font-semibold text-white">#{approvalDetails.pieceIndex + 1}</span>
            </div>
            <div className="flex justify-between text-neutral-300">
              <span>Approved By:</span>
              <span className="font-semibold text-white">{approvalDetails.approvedBy}</span>
            </div>
            <div className="flex justify-between text-neutral-300">
              <span>Customer Progress:</span>
              <span className="font-semibold text-white">{approvalDetails.totalCollected} / 4 pieces</span>
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <Link
                href="/puzzle"
                className="text-primary-400 hover:underline flex items-center gap-1"
              >
                <span>View customer updated puzzle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <MobileTabBar />
    </div>
  );
}