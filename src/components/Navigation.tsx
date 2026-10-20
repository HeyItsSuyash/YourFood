"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Puzzle, Gift, QrCode, ShieldCheck } from "lucide-react";

export function MobileHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-[#003B87] text-white px-5 py-4 flex items-center justify-between shadow-md">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h1 className="text-base font-bold tracking-tight text-white">
            {title || "Table & Thyme"}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs text-blue-100 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      <Link
        href="/"
        className="text-xs px-3 py-1 rounded-full bg-white/15 text-white hover:bg-white/25 font-semibold transition-colors flex items-center gap-1"
      >
        <Utensils className="w-3.5 h-3.5" />
        <span>Menu</span>
      </Link>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Menu", href: "/", icon: Utensils },
    { label: "Quest", href: "/puzzle", icon: Puzzle },
    { label: "Rewards", href: "/draw", icon: Gift },
    { label: "Staff", href: "/staff", icon: ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EEF0F5] safe-area-bottom shadow-lg">
      <div className="max-w-[430px] mx-auto grid grid-cols-4 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? "text-[#003B87] font-bold" : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}