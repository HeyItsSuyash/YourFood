import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");
    const slug = searchParams.get("slug") || "latelier";

    let targetUrl: string;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (tableId) {
      const [table] = await db.select().from(tables).where(eq(tables.id, tableId));
      if (!table) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }
      targetUrl = `${baseUrl}/r/${slug}?tableId=${table.id}&qrToken=${table.qrToken}`;
    } else {
      const [firstTable] = await db.select().from(tables).limit(1);
      if (firstTable) {
        targetUrl = `${baseUrl}/r/${slug}?tableId=${firstTable.id}&qrToken=${firstTable.qrToken}`;
      } else {
        targetUrl = `${baseUrl}/r/${slug}`;
      }
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#1E293B",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      targetUrl,
      qrDataUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
