"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QrCode, CheckCircle2, Smartphone, ArrowRight } from "lucide-react";
import QRCode from "qrcode";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";

interface TableOption {
  id: string;
  tableNumber: string;
  capacity: number;
}

const DEMO_TABLES: TableOption[] = [
  { id: "tbl-01", tableNumber: "Table 01 (Window Alcove)", capacity: 2 },
  { id: "tbl-07", tableNumber: "Table 07 (Garden Terrace)", capacity: 4 },
  { id: "tbl-12", tableNumber: "Table 12 (Main Dining)", capacity: 6 },
  { id: "tbl-18", tableNumber: "Table 18 (Chef's Counter)", capacity: 2 },
];

export default function DemoQrPage() {
  const [tables] = useState<TableOption[]>(DEMO_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableOption>(DEMO_TABLES[1]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      generateQr(window.location.origin, selectedTable.id);
    }
  }, [selectedTable]);

  async function generateQr(baseOrigin: string, tableId: string) {
    try {
      const url = `${baseOrigin}/?table=${tableId}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#051D45",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR generation error", err);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 max-w-[430px] mx-auto text-[#051D45]">
      <MobileHeader title="Table QR Codes" subtitle="Instant contactless entry into Table & Thyme" />

      <main className="p-5 space-y-4">
        {/* Step Info */}
        <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] shadow-sm">
          <div className="flex items-center gap-2 text-[#003B87] font-bold text-xs mb-1">
            <Smartphone className="w-4 h-4" />
            <span>Table & Thyme Fast Pass</span>
          </div>
          <h2 className="text-base font-bold text-[#051D45]">
            Select Table & Scan
          </h2>
          <p className="text-xs text-[#7E89A4] mt-1 leading-relaxed">
            Scan with any smartphone camera or tap the button below to open the frontend menu directly.
          </p>
        </div>

        {/* Table Selector */}
        <div className="p-4 rounded-2xl bg-white border border-[#E4E8EE] shadow-sm">
          <label className="text-xs font-bold text-[#051D45] block mb-2 uppercase tracking-wider">
            Dining Tables
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tables.map((t) => {
              const isSelected = selectedTable.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "border-[#003B87] bg-blue-50/60 text-[#051D45] font-bold shadow-xs ring-1 ring-[#003B87]"
                      : "border-[#E4E8EE] bg-white text-[#7E89A4] hover:bg-[#F8F9FA]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#051D45] font-semibold">{t.tableNumber.split(" ")[0]} {t.tableNumber.split(" ")[1]}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#003B87]" />}
                  </div>
                  <span className="text-[10px] text-[#7E89A4] block mt-0.5">
                    {t.capacity} Guests
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QR Code Presentation */}
        <div className="p-6 rounded-3xl bg-white border border-[#E4E8EE] shadow-md text-center flex flex-col items-center">
          <div className="relative w-60 h-60 bg-white p-3 rounded-2xl border border-[#E4E8EE] shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="Table QR Code"
                width={240}
                height={240}
                className="w-full h-full object-contain rounded-lg"
                priority
              />
            ) : (
              <div className="w-8 h-8 border-2 border-[#003B87] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="mt-4 w-full">
            <span className="text-[11px] text-[#7E89A4] font-medium block">
              Opens Target URL:
            </span>
            <code className="text-xs text-[#003B87] bg-[#F0F4FA] px-3 py-1.5 rounded-lg block mt-1 truncate font-mono font-semibold">
              {origin ? `${origin}/?table=${selectedTable.id}` : "..."}
            </code>
          </div>

          <Link
            href={`/?table=${selectedTable.id}`}
            className="mt-5 w-full py-3.5 px-4 rounded-xl bg-[#003B87] hover:bg-[#051D45] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <span>Open Menu for {selectedTable.tableNumber}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </main>

      <MobileTabBar />
    </div>
  );
}