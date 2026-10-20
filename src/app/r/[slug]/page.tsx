"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Check,
  ChevronRight,
  Clock,
  Flame,
  ArrowRight,
  X,
} from "lucide-react";
import { MobileHeader, MobileTabBar } from "@/components/Navigation";
import { formatCurrency } from "@/lib/utils";

interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryLabels: string[];
  prepTimeMinutes: number;
  modifierGroups: ModifierGroup[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedModifierIds: string[];
  selectedModifierNames: string[];
  totalItemCost: number;
}

export default function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableIdFromUrl = searchParams.get("tableId");

  const [restaurant, setRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<{ id: string; tableNumber: string }[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>(tableIdFromUrl || "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeItemForModal, setActiveItemForModal] = useState<MenuItem | null>(null);
  const [tempModifiers, setTempModifiers] = useState<string[]>([]);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch(`/api/restaurants?slug=${params.slug || "latelier"}`);
        const data = await res.json();
        if (data.success) {
          setRestaurant(data.restaurant);
          setCategories(data.categories);
          setTables(data.tables);
          if (!tableIdFromUrl && data.tables?.length > 0) {
            setSelectedTableId(data.tables[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load restaurant menu", err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [params.slug, tableIdFromUrl]);

  // Handle opening modifier modal or direct add
  function handleInitiateAdd(item: MenuItem) {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setActiveItemForModal(item);
      setTempQuantity(1);
      // Auto-select first option for required groups
      const initialMods: string[] = [];
      for (const grp of item.modifierGroups) {
        if (grp.isRequired && grp.options.length > 0) {
          initialMods.push(grp.options[0].id);
        }
      }
      setTempModifiers(initialMods);
    } else {
      addToCartDirect(item);
    }
  }

  function addToCartDirect(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id && i.selectedModifierIds.length === 0);
      if (existing) {
        return prev.map((i) =>
          i === existing
            ? { ...i, quantity: i.quantity + 1, totalItemCost: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          selectedModifierIds: [],
          selectedModifierNames: [],
          totalItemCost: item.price,
        },
      ];
    });
  }

  function handleConfirmModalAdd() {
    if (!activeItemForModal) return;

    let extraCost = 0;
    const modNames: string[] = [];

    for (const grp of activeItemForModal.modifierGroups) {
      for (const opt of grp.options) {
        if (tempModifiers.includes(opt.id)) {
          extraCost += opt.priceDelta;
          modNames.push(opt.name);
        }
      }
    }

    const unitPrice = activeItemForModal.price + extraCost;
    const newItem: CartItem = {
      menuItemId: activeItemForModal.id,
      name: activeItemForModal.name,
      price: unitPrice,
      quantity: tempQuantity,
      selectedModifierIds: [...tempModifiers],
      selectedModifierNames: modNames,
      totalItemCost: unitPrice * tempQuantity,
    };

    setCart((prev) => [...prev, newItem]);
    setActiveItemForModal(null);
  }

  function toggleModifierOption(groupId: string, optionId: string, maxSelections: number) {
    setTempModifiers((prev) => {
      if (maxSelections === 1) {
        // Find options in same group and replace
        const group = activeItemForModal?.modifierGroups.find((g) => g.id === groupId);
        const otherGroupOptIds = group ? group.options.map((o) => o.id) : [];
        const filtered = prev.filter((id) => !otherGroupOptIds.includes(id));
        return [...filtered, optionId];
      } else {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      }
    });
  }

  function updateQuantity(index: number, delta: number) {
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = {
        ...item,
        quantity: newQty,
        totalItemCost: item.price * newQty,
      };
      return copy;
    });
  }

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.totalItemCost, 0), [cart]);
  const taxAmount = Math.round((subtotal * 8) / 100);
  const serviceCharge = Math.round((subtotal * 5) / 100);
  const totalAmount = subtotal + taxAmount + serviceCharge;

  async function handlePlaceOrder() {
    if (cart.length === 0 || !selectedTableId || !restaurant) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: restaurant.id,
          tableId: selectedTableId,
          customerName: customerName || "Guest Connoisseur",
          customerNotes,
          idempotencyKey,
          items: cart.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            modifierOptionIds: i.selectedModifierIds,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Order failed. Please check table selection.");
        return;
      }

      // Save customerId in localStorage for persistent puzzle rewards
      if (data.order?.customerId) {
        localStorage.setItem("yourfood_customer_id", data.order.customerId);
      }

      // Route directly to thank-you order confirmation screen
      router.push(`/order/${data.order.id}`);
    } catch (err) {
      setErrorMessage("Network error placing order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center max-w-md mx-auto">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Curating Artisan Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 max-w-md mx-auto">
      <MobileHeader title={restaurant?.name || "L'Atelier Bistro"} subtitle="Artisan Seasonal Dining" />

      {/* Table Badge Selection */}
      <div className="bg-surface border-b border-neutral-200/80 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-neutral-500 font-medium">Dining Location:</span>
        <select
          value={selectedTableId}
          onChange={(e) => setSelectedTableId(e.target.value)}
          className="text-xs font-semibold bg-neutral-100 text-neutral-800 rounded-lg px-2.5 py-1 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary-600"
        >
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tableNumber}
            </option>
          ))}
        </select>
      </div>

      <main className="p-4 space-y-6">
        {/* Categories & Food List */}
        {categories.map((category) => (
          <section key={category.id} className="space-y-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-neutral-900 uppercase">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-[11px] text-neutral-500 mt-0.5">{category.description}</p>
              )}
            </div>

            <div className="space-y-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle flex gap-3.5 hover:border-neutral-300 transition-colors"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-semibold text-neutral-900 leading-snug">
                          {item.name}
                        </h3>
                        <span className="text-xs font-bold text-primary-700 shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span>{item.prepTimeMinutes}m</span>
                      </div>

                      <button
                        onClick={() => handleInitiateAdd(item)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Modifier Customization Bottom Sheet Modal */}
      {activeItemForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-5 shadow-float max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">{activeItemForModal.name}</h3>
                <span className="text-xs text-primary-600 font-semibold">
                  Base: {formatCurrency(activeItemForModal.price)}
                </span>
              </div>
              <button
                onClick={() => setActiveItemForModal(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modifier Groups */}
            <div className="space-y-4">
              {activeItemForModal.modifierGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800">{group.name}</span>
                    {group.isRequired && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {group.options.map((option) => {
                      const isSelected = tempModifiers.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleModifierOption(group.id, option.id, group.maxSelections)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? "border-primary-600 bg-primary-50/50 text-neutral-900 font-medium"
                              : "border-neutral-200 bg-neutral-50 text-neutral-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected
                                  ? "border-primary-600 bg-primary-600 text-white"
                                  : "border-neutral-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </span>
                            <span>{option.name}</span>
                          </div>
                          {option.priceDelta > 0 && (
                            <span className="text-neutral-500 font-normal">
                              +{formatCurrency(option.priceDelta)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmModalAdd}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold tracking-wide transition-colors"
            >
              Add to Order
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart / Checkout Drawer */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-30 max-w-md mx-auto px-4 pb-2">
          <div className="p-4 rounded-2xl bg-neutral-950 text-white shadow-float space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Your Order Selection</span>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                {cart.reduce((s, i) => s + i.quantity, 0)} item(s)
              </span>
            </div>

            {/* Cart Items List */}
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-900">
              {cart.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-neutral-200">{item.name}</span>
                    {item.selectedModifierNames.length > 0 && (
                      <p className="text-[10px] text-neutral-400">
                        {item.selectedModifierNames.join(", ")}
                      </p>
                    )}
                    <span className="text-[11px] text-primary-300 font-semibold block">
                      {formatCurrency(item.totalItemCost)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(idx, -1)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(idx, 1)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Name / Notes */}
            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                placeholder="Guest Name (for order delivery confirmation)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs bg-neutral-900 text-white placeholder-neutral-500 rounded-lg px-3 py-1.5 border border-neutral-800 focus:outline-none focus:border-primary-500"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
            )}

            {/* Subtotal & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                  Total (incl. tax & service)
                </span>
                <span className="text-sm font-bold text-white">{formatCurrency(totalAmount)}</span>
              </div>

              <button
                disabled={submitting}
                onClick={handlePlaceOrder}
                className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <span>{submitting ? "Confirming..." : "Send Order to Kitchen"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileTabBar />
    </div>
  );
}