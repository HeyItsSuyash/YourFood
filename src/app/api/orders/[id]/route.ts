import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, tables } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const [table] = await db.select().from(tables).where(eq(tables.id, order.tableId));

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        tableNumber: table ? table.tableNumber : "Table",
      },
      items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}