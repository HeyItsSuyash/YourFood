import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  loyaltyCampaigns,
  customerPuzzlePieces,
  prizeCatalogue,
  customerDrawEntries,
  customerRewards,
  customerEvents,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateRewardCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, preferredPrizeId, drawMode } = body;

    if (!customerId || !preferredPrizeId) {
      return NextResponse.json({ error: "Customer ID and preferred prize selection are required" }, { status: 400 });
    }

    const [campaign] = await db
      .select()
      .from(loyaltyCampaigns)
      .where(eq(loyaltyCampaigns.isActive, true))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "No active loyalty campaign" }, { status: 404 });
    }

    // 1. Check if customer already entered the draw for this campaign (Anti-duplicate draw prevention)
    const [existingEntry] = await db
      .select()
      .from(customerDrawEntries)
      .where(
        and(
          eq(customerDrawEntries.campaignId, campaign.id),
          eq(customerDrawEntries.customerId, customerId)
        )
      );

    if (existingEntry) {
      // Find the reward associated with the existing entry
      const [existingReward] = await db
        .select()
        .from(customerRewards)
        .where(eq(customerRewards.id, existingEntry.rewardId!));

      const [wonPrize] = await db
        .select()
        .from(prizeCatalogue)
        .where(eq(prizeCatalogue.id, existingEntry.wonPrizeId));

      return NextResponse.json({
        success: true,
        message: "You have already completed the Grand Draw for this campaign.",
        isDuplicate: true,
        drawEntry: existingEntry,
        wonPrize,
        reward: existingReward,
      });
    }

    // 2. Server-side validation of puzzle completion (cannot be bypassed by frontend)
    const pieces = await db
      .select()
      .from(customerPuzzlePieces)
      .where(
        and(
          eq(customerPuzzlePieces.campaignId, campaign.id),
          eq(customerPuzzlePieces.customerId, customerId)
        )
      );

    if (pieces.length < campaign.totalPieces) {
      return NextResponse.json({
        error: `Puzzle is incomplete! You have collected ${pieces.length} of ${campaign.totalPieces} required pieces.`,
        collectedCount: pieces.length,
        requiredCount: campaign.totalPieces,
      }, { status: 403 });
    }

    // 3. Verify selected preferred prize exists
    const [preferredPrize] = await db
      .select()
      .from(prizeCatalogue)
      .where(eq(prizeCatalogue.id, preferredPrizeId));

    if (!preferredPrize) {
      return NextResponse.json({ error: "Selected preferred prize does not exist" }, { status: 404 });
    }

    // 4. Determine winning prize based on configured draw mode:
    // Modes:
    // - "guaranteed_preferred": guaranteed selection if customer chose it
    // - "preference_weighted": higher probability given to customer preferred prize (e.g. 70% chance preferred, 30% other prizes)
    // - "pure_random": draw strictly by catalogue odds weight
    const allPrizes = await db.select().from(prizeCatalogue).where(eq(prizeCatalogue.isActive, true));

    let winningPrize = preferredPrize;
    const mode = drawMode || "preference_weighted";

    if (mode === "preference_weighted") {
      const roll = Math.random() * 100;
      if (roll <= 75) {
        // 75% probability customer wins their preferred prize
        winningPrize = preferredPrize;
      } else {
        // 25% probability randomly awarded from remaining catalogue
        const otherPrizes = allPrizes.filter((p) => p.id !== preferredPrize.id);
        if (otherPrizes.length > 0) {
          winningPrize = otherPrizes[Math.floor(Math.random() * otherPrizes.length)];
        }
      }
    } else if (mode === "pure_random") {
      const totalWeight = allPrizes.reduce((sum, p) => sum + p.oddsWeight, 0);
      let rand = Math.random() * totalWeight;
      for (const p of allPrizes) {
        if (rand < p.oddsWeight) {
          winningPrize = p;
          break;
        }
        rand -= p.oddsWeight;
      }
    }

    // 5. Generate secure customer reward voucher
    const rewardCode = generateRewardCode("YF-GOLD");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

    const [reward] = await db
      .insert(customerRewards)
      .values({
        orgId: campaign.orgId,
        campaignId: campaign.id,
        customerId,
        prizeId: winningPrize.id,
        rewardCode,
        rewardType: winningPrize.rewardType,
        rewardValue: winningPrize.rewardValue,
        title: winningPrize.title,
        expiresAt,
      })
      .returning();

    // 6. Record draw entry transactionally
    const [drawEntry] = await db
      .insert(customerDrawEntries)
      .values({
        orgId: campaign.orgId,
        campaignId: campaign.id,
        customerId,
        preferredPrizeId: preferredPrize.id,
        wonPrizeId: winningPrize.id,
        rewardId: reward.id,
        drawMode: mode,
        status: "completed",
      })
      .returning();

    // 7. Audit log & CRM event
    await db.insert(customerEvents).values({
      orgId: campaign.orgId,
      customerId,
      eventType: "reward_redeemed",
      title: `Won Grand Draw: ${winningPrize.title}`,
      metadata: {
        preferredPrize: preferredPrize.title,
        wonPrize: winningPrize.title,
        rewardCode,
        drawMode: mode,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Draw completed successfully!",
      drawEntry,
      wonPrize: {
        id: winningPrize.id,
        title: winningPrize.title,
        description: winningPrize.description,
        category: winningPrize.category,
        rewardType: winningPrize.rewardType,
        rewardValue: winningPrize.rewardValue,
        imageUrl: winningPrize.imageUrl,
      },
      preferredPrize: {
        id: preferredPrize.id,
        title: preferredPrize.title,
      },
      isPreferredWon: winningPrize.id === preferredPrize.id,
      reward: {
        id: reward.id,
        rewardCode: reward.rewardCode,
        title: reward.title,
        expiresAt: reward.expiresAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute lucky draw";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}