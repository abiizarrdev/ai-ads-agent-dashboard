import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { platformConnections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const connections = await db.select().from(platformConnections);
    return NextResponse.json(connections);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, accountName, accountId, composioConnectionId, scopes } = body;

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    // Check if connection exists
    const [existing] = await db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.platform, platform));

    if (existing) {
      const [updated] = await db
        .update(platformConnections)
        .set({
          connected: true,
          accountName,
          accountId,
          composioConnectionId,
          scopes,
          connectedAt: new Date(),
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(platformConnections.platform, platform))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [connection] = await db
        .insert(platformConnections)
        .values({
          platform,
          connected: true,
          accountName,
          accountId,
          composioConnectionId,
          scopes,
          connectedAt: new Date(),
          lastSyncAt: new Date(),
        })
        .returning();
      return NextResponse.json(connection, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    await db
      .update(platformConnections)
      .set({
        connected: false,
        accountName: null,
        accountId: null,
        composioConnectionId: null,
        connectedAt: null,
        lastSyncAt: null,
        updatedAt: new Date(),
      })
      .where(eq(platformConnections.platform, platform as "google_ads" | "meta_ads" | "tiktok_ads"));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
