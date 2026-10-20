"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Receipt, ArrowRight, Puzzle, Sparkles } from "lucide-react";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";
import { formatCurrency } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  tableNumber: string;
  createdAt: string;
  customerId?: string;
}

interface OrderItemDetail {
  id: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  subtotal: number;
}

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          setItems(data.items);
          if (data.order?.customerId) {
            localStorage.setItem("yourfood_customer_id", data.order.customerId);
            // Award initial dining order piece if not already claimed
            fetch("/api/loyalty/earn", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "initial_order",
                customerId: data.order.customerId,
                orderId: data.order.id,
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-md mx-auto">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Retrieving Order Details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-md mx-auto text-center flex flex-col justify-center">
        <h2 className="text-base font-semibold text-neutral-900">Order Not Found</h2>
        <p className="text-xs text-neutral-500 mt-1">This order record could not be retrieved.</p>
        <Link
          href="/r/latelier"
          className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-medium inline-block"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      <MobileHeader title="Order Confirmed" subtitle={`Order #${order.orderNumber}`} />

      <main className="p-4 space-y-4">
        {/* Exact Primary Confirmation Message */}
        <div className="p-6 rounded-3xl bg-surface border border-neutral-200/80 shadow-subtle text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            Thank you, your order will be delivered shortly.
          </h2>

          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            Our kitchen brigade is currently preparing your seasonal artisan dishes.
          </p>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-semibold text-neutral-800">{order.tableNumber}</span>
            </div>
            <span className="text-neutral-300">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Est. ~15-20 min</span>
            </div>
          </div>
        </div>

        {/* Step 4 Natural Loyalty Puzzle Introduction (Strictly No Nudging) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary-600/30 text-primary-400">
                <Puzzle className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-300">
                Collector&apos;s Quest
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">Piece Unlocked!</span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white leading-snug">
              The Connoisseur&apos;s Crest Jigsaw
            </h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Your dining order unlocked a collectible crest piece! Complete all 4 pieces to access the Grand Lucky Draw with guaranteed dining rewards.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/puzzle"
              className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>View Jigsaw Puzzle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/r/latelier"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Browse more
            </Link>
          </div>
        </div>

        {/* Order Receipt Details */}
        <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
            <Receipt className="w-4 h-4 text-neutral-400" />
            <span>Order Receipt</span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {items.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-medium text-neutral-800">
                    {item.quantity}x {item.itemName}
                  </span>
                </div>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-200/80 space-y-1 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax (8%)</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Service Charge (5%)</span>
              <span>{formatCurrency(order.serviceChargeAmount)}</span>
            </div>
            <div className="flex justify-between text-neutral-900 font-bold text-sm pt-1 border-t border-neutral-100">
              <span>Total Paid</span>
              <span className="text-primary-700">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </main>

      <MobileTabBar />
    </div>
  );
}