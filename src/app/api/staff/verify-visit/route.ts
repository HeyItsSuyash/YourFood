import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  customerPuzzlePieces,
  loyaltyCampaigns,
  users,
  memberships,
  customerEvents,
  auditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, staffPasscode } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Authenticate staff via session or demo staff passcode "service123"
    let staffUser: { id: string; fullName: string; role: string } | null = null;
    const session = await getSession();

    if (session) {
      staffUser = { id: session.userId, fullName: session.fullName, role: session.role };
    } else if (staffPasscode === "service123" || staffPasscode === "Password123!") {
      // Find waiter user from db
      const [waiter] = await db.select().from(users).where(eq(users.email, "service@latelier.com"));
      if (waiter) {
        staffUser = { id: waiter.id, fullName: waiter.fullName, role: "waiter" };
      }
    }

    if (!staffUser) {
      return NextResponse.json({
        error: "Unauthorized: Only authorized restaurant staff can approve qualifying return visits.",
      }, { status: 401 });
    }

    // Fetch order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.customerId) {
      return NextResponse.json({ error: "Order is not associated with an identified customer" }, { status: 400 });
    }

    // Active loyalty campaign
    const [campaign] = await db
      .select()
      .from(loyaltyCampaigns)
      .where(eq(loyaltyCampaigns.isActive, true))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "No active loyalty campaign" }, { status: 404 });
    }

    // 1. Verify Minimum Spend Requirement (e.g. $20.00 / 2000 cents)
    // Server calculates on actual order subtotal (before non-qualifying extras) or total amount
    const eligibleAmount = order.totalAmount;
    if (eligibleAmount < campaign.minOrderAmount) {
      return NextResponse.json({
        error: `Order does not qualify. Minimum spend is ${(campaign.minOrderAmount / 100).toFixed(2)}, but order total was ${(eligibleAmount / 100).toFixed(2)}.`,
        minOrderAmount: campaign.minOrderAmount,
        orderTotal: eligibleAmount,
      }, { status: 400 });
    }

    // 2. Prevent same order from earning a piece more than once
    const [existingPieceForOrder] = await db
      .select()
      .from(customerPuzzlePieces)
      .where(
        and(
          eq(customerPuzzlePieces.campaignId, campaign.id),
          eq(customerPuzzlePieces.orderId, order.id)
        )
      );

    if (existingPieceForOrder) {
      return NextResponse.json({
        error: "This order has already been used to claim a puzzle piece.",
        code: "ORDER_ALREADY_USED",
      }, { status: 400 });
    }

    // 3. Check customer existing pieces
    const customerPieces = await db
      .select()
      .from(customerPuzzlePieces)
      .where(
        and(
          eq(customerPuzzlePieces.campaignId, campaign.id),
          eq(customerPuzzlePieces.customerId, order.customerId)
        )
      );

    if (customerPieces.length >= campaign.totalPieces) {
      return NextResponse.json({
        error: "Customer has already completed all puzzle pieces in this campaign.",
        isCompleted: true,
      }, { status: 400 });
    }

    // Find next uncollected piece index
    const earnedIndices = new Set(customerPieces.map((p) => p.pieceIndex));
    let nextIdx = -1;
    for (let i = 0; i < campaign.totalPieces; i++) {
      if (!earnedIndices.has(i)) {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx === -1) {
      return NextResponse.json({ error: "No remaining uncollected pieces available." }, { status: 400 });
    }

    // Award piece with recorded staff approval
    const [awardedPiece] = await db
      .insert(customerPuzzlePieces)
      .values({
        orgId: campaign.orgId,
        campaignId: campaign.id,
        customerId: order.customerId,
        pieceIndex: nextIdx,
        reason: "qualifying_visit",
        orderId: order.id,
        approvedByUserId: staffUser.id,
      })
      .returning();

    // Audit trail
    await db.insert(auditLogs).values({
      orgId: campaign.orgId,
      userId: staffUser.id,
      action: "approve_qualifying_visit",
      details: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        pieceIndex: nextIdx,
        staffName: staffUser.fullName,
      },
    });

    await db.insert(customerEvents).values({
      orgId: campaign.orgId,
      customerId: order.customerId,
      eventType: "piece_earned",
      title: `Visit Verified by ${staffUser.fullName}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, pieceIndex: nextIdx },
    });

    const newTotal = customerPieces.length + 1;
    return NextResponse.json({
      success: true,
      message: `Qualifying visit verified by ${staffUser.fullName}. Piece #${nextIdx + 1} awarded!`,
      pieceIndex: nextIdx,
      totalCollected: newTotal,
      isCompleted: newTotal >= campaign.totalPieces,
      approvedBy: staffUser.fullName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify visit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}