import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, categories, menuItems, modifierGroups, modifierOptions, tables } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "latelier";

    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    if (!org) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const cats = await db.select().from(categories).where(eq(categories.orgId, org.id)).orderBy(asc(categories.sortOrder));
    const items = await db.select().from(menuItems).where(eq(menuItems.orgId, org.id)).orderBy(asc(menuItems.sortOrder));
    const modGroups = await db.select().from(modifierGroups).where(eq(modifierGroups.orgId, org.id));
    const modOptions = await db.select().from(modifierOptions);
    const tbls = await db.select().from(tables).where(eq(tables.orgId, org.id));

    const groupsWithOptions = modGroups.map((g) => ({
      ...g,
      options: modOptions.filter((opt) => opt.modifierGroupId === g.id),
    }));

    const itemsWithModifiers = items.map((item) => ({
      ...item,
      modifierGroups: groupsWithOptions.filter((g) => g.menuItemId === item.id),
    }));

    const categoriesWithItems = cats.map((cat) => ({
      ...cat,
      items: itemsWithModifiers.filter((item) => item.categoryId === cat.id),
    }));

    return NextResponse.json({
      success: true,
      restaurant: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        brandColor: org.brandColor,
        currency: org.currency,
        taxPercentage: org.taxPercentage,
        serviceChargePercentage: org.serviceChargePercentage,
        operatingHours: org.operatingHours,
      },
      categories: categoriesWithItems,
      tables: tbls.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        qrToken: t.qrToken,
        capacity: t.capacity,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load restaurant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}