import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaignMetrics } from "@/db/schema";
import { desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all metrics for last 14 days
    const metrics = await db
      .select()
      .from(campaignMetrics)
      .orderBy(desc(campaignMetrics.date))
      .limit(200);

    // Aggregate overview stats
    const overview = await db
      .select({
        totalSpend: sql<number>`COALESCE(SUM(spend), 0)`,
        totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
        totalImpressions: sql<number>`COALESCE(SUM(impressions), 0)`,
        totalClicks: sql<number>`COALESCE(SUM(clicks), 0)`,
        avgRoas: sql<number>`COALESCE(AVG(roas), 0)`,
      })
      .from(campaignMetrics);

    // Per-platform aggregates
    const byPlatform = await db
      .select({
        platform: campaignMetrics.platform,
        totalSpend: sql<number>`COALESCE(SUM(spend), 0)`,
        totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
        totalImpressions: sql<number>`COALESCE(SUM(impressions), 0)`,
        avgRoas: sql<number>`COALESCE(AVG(roas), 0)`,
      })
      .from(campaignMetrics)
      .groupBy(campaignMetrics.platform);

    return NextResponse.json({
      metrics,
      overview: overview[0],
      byPlatform,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
