import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loyaltyCampaigns, customerPuzzlePieces, customerDrawEntries, customerRewards } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const orgId = searchParams.get("orgId");

    const [campaign] = await db
      .select()
      .from(loyaltyCampaigns)
      .where(eq(loyaltyCampaigns.isActive, true))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "No active loyalty campaign found" }, { status: 404 });
    }

    if (!customerId) {
      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          totalPieces: campaign.totalPieces,
          minOrderAmount: campaign.minOrderAmount,
          artworkTheme: campaign.artworkTheme,
          rewardDescription: campaign.rewardDescription,
        },
        collectedPieces: [],
        totalCollected: 0,
        isCompleted: false,
        drawStatus: null,
      });
    }

    // Fetch pieces collected by this customer
    const pieces = await db
      .select()
      .from(customerPuzzlePieces)
      .where(
        and(
          eq(customerPuzzlePieces.campaignId, campaign.id),
          eq(customerPuzzlePieces.customerId, customerId)
        )
      );

    const collectedIndices = pieces.map((p) => p.pieceIndex);
    const isCompleted = collectedIndices.length >= campaign.totalPieces;

    // Check if lucky draw entry exists
    const [drawEntry] = await db
      .select()
      .from(customerDrawEntries)
      .where(
        and(
          eq(customerDrawEntries.campaignId, campaign.id),
          eq(customerDrawEntries.customerId, customerId)
        )
      );

    // Check customer rewards
    const rewards = await db
      .select()
      .from(customerRewards)
      .where(
        and(
          eq(customerRewards.campaignId, campaign.id),
          eq(customerRewards.customerId, customerId)
        )
      );

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        totalPieces: campaign.totalPieces,
        minOrderAmount: campaign.minOrderAmount,
        artworkTheme: campaign.artworkTheme,
        rewardDescription: campaign.rewardDescription,
      },
      pieces,
      collectedIndices,
      totalCollected: collectedIndices.length,
      isCompleted,
      drawEntry: drawEntry || null,
      rewards,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load puzzle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}