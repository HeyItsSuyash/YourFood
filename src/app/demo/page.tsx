"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QrCode, ExternalLink, RefreshCw, CheckCircle2, Smartphone, ArrowRight } from "lucide-react";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";

interface TableOption {
  id: string;
  tableNumber: string;
  qrToken: string;
  capacity: number;
}

export default function DemoQrPage() {
  const [tables, setTables] = useState<TableOption[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableOption | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/restaurants?slug=latelier");
        const data = await res.json();
        if (data.success && data.tables?.length > 0) {
          setTables(data.tables);
          setSelectedTable(data.tables[0]);
          await fetchQr(data.tables[0].id);
        }
      } catch (err) {
        console.error("Failed to load tables", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function fetchQr(tableId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/qr?tableId=${tableId}&slug=latelier`);
      const data = await res.json();
      if (data.success) {
        setQrDataUrl(data.qrDataUrl);
        setTargetUrl(data.targetUrl);
      }
    } catch (err) {
      console.error("Failed to generate QR", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTable(t: TableOption) {
    setSelectedTable(t);
    fetchQr(t.id);
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-md mx-auto">
      <MobileHeader title="QR Code Entry" subtitle="Simulate scanning a real dining table" />

      <main className="p-4 space-y-4">
        {/* Step Explanation Card */}
        <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle">
          <div className="flex items-center gap-2 text-primary-600 font-medium text-xs mb-1">
            <Smartphone className="w-4 h-4" />
            <span>Step 1 of Experience</span>
          </div>
          <h2 className="text-base font-semibold text-neutral-900">
            Scan & Dine or Tap to Enter
          </h2>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            Every table has a distinct QR code. Scan it with your mobile camera or tap below to open the customer ordering experience directly.
          </p>
        </div>

        {/* Table Selector */}
        <div className="p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle">
          <label className="text-xs font-semibold text-neutral-700 block mb-2">
            Select Dining Table
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tables.map((t) => {
              const isSelected = selectedTable?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTable(t)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "border-primary-600 bg-primary-50/60 text-primary-950 font-semibold shadow-sm"
                      : "border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t.tableNumber}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-normal block mt-0.5">
                    Capacity: {t.capacity} guests
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QR Code Presentation */}
        <div className="p-6 rounded-3xl bg-surface border border-neutral-200/80 shadow-card text-center flex flex-col items-center">
          <div className="relative w-64 h-64 bg-white p-3 rounded-2xl border border-neutral-200 shadow-inner flex items-center justify-center">
            {loading ? (
              <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
            ) : qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="Table QR Code"
                width={256}
                height={256}
                className="w-full h-full object-contain rounded-lg"
                priority
              />
            ) : (
              <p className="text-xs text-neutral-400">Failed to render QR</p>
            )}
          </div>

          <div className="mt-4 w-full">
            <span className="text-xs text-neutral-400 font-medium block">
              Resolves destination:
            </span>
            <code className="text-[11px] text-neutral-600 bg-neutral-100 px-2 py-1 rounded block mt-1 truncate max-w-full font-mono">
              {targetUrl || "Generating..."}
            </code>
          </div>

          {selectedTable && (
            <Link
              href={`/r/latelier?tableId=${selectedTable.id}&qrToken=${selectedTable.qrToken}`}
              className="mt-5 w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Open Menu for {selectedTable.tableNumber}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </main>

      <MobileTabBar />
    </div>
  );
}