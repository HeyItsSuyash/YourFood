import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, modifierOptions, tables, customers, customerEvents } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";

interface OrderItemPayload {
  menuItemId: string;
  quantity: number;
  modifierOptionIds?: string[];
  itemNotes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, tableId, items, customerName, customerPhone, customerEmail, idempotencyKey } = body;

    if (!orgId || !tableId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    // Check idempotency to prevent duplicate orders from repeated submissions
    if (idempotencyKey) {
      const [existingOrder] = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey));
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: "Thank you, your order will be delivered shortly.",
          order: existingOrder,
          isDuplicate: true,
        });
      }
    }

    // Verify table exists
    const [table] = await db.select().from(tables).where(eq(tables.id, tableId));
    if (!table) {
      return NextResponse.json({ error: "Invalid table specified" }, { status: 404 });
    }

    // Server-side item price verification
    const menuItemIds = items.map((i: OrderItemPayload) => i.menuItemId);
    const dbMenuItems = await db.select().from(menuItems).where(inArray(menuItems.id, menuItemIds));
    const itemMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // Modifiers options verification
    const allModIds: string[] = [];
    for (const it of items as OrderItemPayload[]) {
      if (it.modifierOptionIds) allModIds.push(...it.modifierOptionIds);
    }
    const dbModOptions = allModIds.length > 0 ? await db.select().from(modifierOptions).where(inArray(modifierOptions.id, allModIds)) : [];
    const modMap = new Map(dbModOptions.map((m) => [m.id, m]));

    let subtotal = 0;
    const validatedItems = [];

    for (const rawItem of items as OrderItemPayload[]) {
      const dbItem = itemMap.get(rawItem.menuItemId);
      if (!dbItem) {
        return NextResponse.json({ error: `Item ${rawItem.menuItemId} does not exist` }, { status: 400 });
      }

      let itemModTotal = 0;
      const selectedMods = [];
      if (rawItem.modifierOptionIds) {
        for (const modId of rawItem.modifierOptionIds) {
          const modOpt = modMap.get(modId);
          if (modOpt) {
            itemModTotal += modOpt.priceDelta;
            selectedMods.push({
              groupName: "Option",
              optionName: modOpt.name,
              priceDelta: modOpt.priceDelta,
            });
          }
        }
      }

      const itemUnitCost = dbItem.price + itemModTotal;
      const itemSubtotal = itemUnitCost * Math.max(1, rawItem.quantity);
      subtotal += itemSubtotal;

      validatedItems.push({
        menuItemId: dbItem.id,
        itemName: dbItem.name,
        itemPrice: dbItem.price,
        quantity: Math.max(1, rawItem.quantity),
        selectedModifiers: selectedMods,
        itemNotes: rawItem.itemNotes || null,
        subtotal: itemSubtotal,
      });
    }

    const taxPercentage = 8;
    const servicePercentage = 5;
    const taxAmount = Math.round((subtotal * taxPercentage) / 100);
    const serviceChargeAmount = Math.round((subtotal * servicePercentage) / 100);
    const totalAmount = subtotal + taxAmount + serviceChargeAmount;

    // Create or retrieve customer
    const [newCustomer] = await db.insert(customers).values({
      orgId,
      name: customerName || "Guest Connoisseur",
      phone: customerPhone || null,
      email: customerEmail || null,
      totalOrders: 1,
      totalSpent: totalAmount,
      lastVisitAt: new Date(),
    }).returning();
    const customerId = newCustomer.id;

    const orderNumber = generateOrderNumber();

    const [createdOrder] = await db.insert(orders).values({
      orgId,
      locationId: table.locationId,
      tableId: table.id,
      customerId,
      orderNumber,
      status: "confirmed",
      paymentStatus: "paid", // Simulated payment for demo
      paymentMethod: "card_pos",
      subtotal,
      taxAmount,
      serviceChargeAmount,
      discountAmount: 0,
      totalAmount,
      idempotencyKey: idempotencyKey || null,
      customerNotes: body.customerNotes || null,
    }).returning();

    // Insert order items
    for (const valItem of validatedItems) {
      await db.insert(orderItems).values({
        orderId: createdOrder.id,
        menuItemId: valItem.menuItemId,
        itemName: valItem.itemName,
        itemPrice: valItem.itemPrice,
        quantity: valItem.quantity,
        selectedModifiers: valItem.selectedModifiers,
        itemNotes: valItem.itemNotes,
        subtotal: valItem.subtotal,
      });
    }

    // Log CRM event
    await db.insert(customerEvents).values({
      orgId,
      customerId,
      eventType: "order_placed",
      title: `Placed Order #${orderNumber}`,
      metadata: { totalAmount, itemsCount: validatedItems.length, tableNumber: table.tableNumber },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you, your order will be delivered shortly.",
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        subtotal: createdOrder.subtotal,
        taxAmount: createdOrder.taxAmount,
        serviceChargeAmount: createdOrder.serviceChargeAmount,
        totalAmount: createdOrder.totalAmount,
        status: createdOrder.status,
        tableNumber: table.tableNumber,
        customerId,
        createdAt: createdOrder.createdAt,
      },
      items: validatedItems,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}