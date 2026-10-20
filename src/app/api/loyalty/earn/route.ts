import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  loyaltyCampaigns,
  customerPuzzlePieces,
  feedbackComments,
  customerEvents,
  orders,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, customerId, orderId, commentText, rating, serviceAspects, browserVerified } = body;

    if (!customerId) {
      return NextResponse.json({ error: "Customer identification required" }, { status: 400 });
    }

    const [campaign] = await db
      .select()
      .from(loyaltyCampaigns)
      .where(eq(loyaltyCampaigns.isActive, true))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "No active loyalty campaign" }, { status: 404 });
    }

    // Get current pieces already earned by customer
    const existingPieces = await db
      .select()
      .from(customerPuzzlePieces)
      .where(
        and(
          eq(customerPuzzlePieces.campaignId, campaign.id),
          eq(customerPuzzlePieces.customerId, customerId)
        )
      );

    const earnedIndices = new Set(existingPieces.map((p) => p.pieceIndex));
    const earnedReasons = new Set(existingPieces.map((p) => p.reason));

    // Find next available piece index (0, 1, 2, 3)
    const findNextAvailableIndex = (): number | null => {
      for (let i = 0; i < campaign.totalPieces; i++) {
        if (!earnedIndices.has(i)) return i;
      }
      return null;
    };

    // =========================================================================
    // RULE A: Install the PWA to earn ONE piece
    // =========================================================================
    if (action === "pwa_install") {
      // Prevent repeated claims
      if (earnedReasons.has("pwa_install")) {
        return NextResponse.json({
          error: "You have already claimed your PWA installation reward piece.",
          code: "ALREADY_CLAIMED",
        }, { status: 400 });
      }

      const nextIdx = findNextAvailableIndex();
      if (nextIdx === null) {
        return NextResponse.json({
          error: "Puzzle is already complete!",
          isCompleted: true,
        }, { status: 400 });
      }

      const [awardedPiece] = await db
        .insert(customerPuzzlePieces)
        .values({
          orgId: campaign.orgId,
          campaignId: campaign.id,
          customerId,
          pieceIndex: nextIdx,
          reason: "pwa_install",
          orderId: orderId || null,
        })
        .returning();

      await db.insert(customerEvents).values({
        orgId: campaign.orgId,
        customerId,
        eventType: "piece_earned",
        title: "Earned Piece via App Installation",
        metadata: { pieceIndex: nextIdx, browserVerified: !!browserVerified },
      });

      const totalCount = existingPieces.length + 1;
      return NextResponse.json({
        success: true,
        message: "Congratulations! 1 puzzle piece unlocked for installing the app.",
        pieceIndex: nextIdx,
        totalCollected: totalCount,
        isCompleted: totalCount >= campaign.totalPieces,
      });
    }

    // =========================================================================
    // RULE B: Submit a private comment to earn TWO pieces
    // =========================================================================
    if (action === "comment_submission") {
      if (!commentText || typeof commentText !== "string" || commentText.trim().length < 5) {
        return NextResponse.json({
          error: "Please share at least a few words (min 5 characters) of feedback.",
        }, { status: 400 });
      }

      // Check if comment already submitted under this campaign
      const existingComments = await db
        .select()
        .from(feedbackComments)
        .where(
          and(
            eq(feedbackComments.orgId, campaign.orgId),
            eq(feedbackComments.customerId, customerId)
          )
        );

      if (existingComments.length > 0) {
        return NextResponse.json({
          error: "You have already received your reward for feedback on this visit.",
          code: "ALREADY_CLAIMED",
        }, { status: 400 });
      }

      // Persist feedback
      await db.insert(feedbackComments).values({
        orgId: campaign.orgId,
        customerId,
        orderId: orderId || null,
        rating: typeof rating === "number" ? Math.min(5, Math.max(1, rating)) : 5,
        commentText: commentText.trim(),
        serviceAspects: Array.isArray(serviceAspects) ? serviceAspects : [],
        piecesAwarded: 2,
      });

      // Award up to 2 available pieces
      const awardedIndices: number[] = [];
      for (let step = 0; step < 2; step++) {
        const nextIdx = findNextAvailableIndex();
        if (nextIdx !== null) {
          earnedIndices.add(nextIdx);
          await db.insert(customerPuzzlePieces).values({
            orgId: campaign.orgId,
            campaignId: campaign.id,
            customerId,
            pieceIndex: nextIdx,
            reason: "comment_submission",
            orderId: orderId || null,
          });
          awardedIndices.push(nextIdx);
        }
      }

      await db.insert(customerEvents).values({
        orgId: campaign.orgId,
        customerId,
        eventType: "piece_earned",
        title: `Earned ${awardedIndices.length} Piece(s) via Feedback`,
        metadata: { piecesAwarded: awardedIndices.length, commentLength: commentText.length },
      });

      const totalCount = existingPieces.length + awardedIndices.length;
      return NextResponse.json({
        success: true,
        message: `Thank you for your valuable feedback! ${awardedIndices.length} puzzle piece(s) unlocked.`,
        awardedIndices,
        totalCollected: totalCount,
        isCompleted: totalCount >= campaign.totalPieces,
      });
    }

    // =========================================================================
    // INITIAL ORDER EARNING (Automatic piece on first dining order)
    // =========================================================================
    if (action === "initial_order") {
      if (earnedReasons.has("initial_order")) {
        return NextResponse.json({
          error: "Initial dining order piece already claimed.",
          code: "ALREADY_CLAIMED",
        }, { status: 400 });
      }

      const nextIdx = findNextAvailableIndex();
      if (nextIdx === null) {
        return NextResponse.json({ error: "Puzzle already completed", isCompleted: true }, { status: 400 });
      }

      await db.insert(customerPuzzlePieces).values({
        orgId: campaign.orgId,
        campaignId: campaign.id,
        customerId,
        pieceIndex: nextIdx,
        reason: "initial_order",
        orderId: orderId || null,
      });

      const totalCount = existingPieces.length + 1;
      return NextResponse.json({
        success: true,
        message: "1 puzzle piece unlocked for dining with us today!",
        pieceIndex: nextIdx,
        totalCollected: totalCount,
        isCompleted: totalCount >= campaign.totalPieces,
      });
    }

    return NextResponse.json({ error: "Invalid earning action specified" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to earn piece";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}