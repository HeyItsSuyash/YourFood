import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prizeCatalogue, loyaltyCampaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const [campaign] = await db
      .select()
      .from(loyaltyCampaigns)
      .where(eq(loyaltyCampaigns.isActive, true))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "No active loyalty campaign" }, { status: 404 });
    }

    const prizes = await db
      .select()
      .from(prizeCatalogue)
      .where(eq(prizeCatalogue.isActive, true));

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        rewardDescription: campaign.rewardDescription,
      },
      prizes: prizes.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        rewardType: p.rewardType,
        rewardValue: p.rewardValue,
        imageUrl: p.imageUrl,
        oddsWeight: p.oddsWeight,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load prizes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}