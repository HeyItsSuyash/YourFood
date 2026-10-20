"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Puzzle, Gift, QrCode, ShieldCheck } from "lucide-react";

export function MobileHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3.5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
          <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
            {title || "L'Atelier Gourmet"}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs text-neutral-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      <Link
        href="/demo"
        className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 hover:text-neutral-900 font-medium border border-neutral-200 transition-colors flex items-center gap-1"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>QR Demo</span>
      </Link>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Menu", href: "/r/latelier", icon: Utensils },
    { label: "Quest", href: "/puzzle", icon: Puzzle },
    { label: "Rewards", href: "/draw", icon: Gift },
    { label: "Staff", href: "/staff", icon: ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-neutral-200 safe-area-bottom">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? "text-primary-600 font-semibold" : "text-neutral-400 hover:text-neutral-700"
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