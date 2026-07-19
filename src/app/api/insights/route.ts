import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiInsights, campaignMetrics } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { generateAdInsights } from "@/lib/cerebras";

export async function GET() {
  try {
    const insights = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.dismissed, false))
      .orderBy(desc(aiInsights.createdAt))
      .limit(10);

    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { regenerate } = body;

    if (regenerate) {
      // Get recent metrics for AI analysis
      const recentMetrics = await db
        .select({
          platform: campaignMetrics.platform,
          spend: sql<number>`COALESCE(SUM(spend), 0)`,
          conversions: sql<number>`COALESCE(SUM(conversions), 0)`,
          avgRoas: sql<number>`COALESCE(AVG(roas), 0)`,
          avgCtr: sql<number>`COALESCE(AVG(ctr), 0)`,
        })
        .from(campaignMetrics)
        .groupBy(campaignMetrics.platform);

      const metricsForAI = recentMetrics.map((m) => ({
        platform: m.platform,
        spend: m.spend,
        roas: m.avgRoas,
        conversions: m.conversions,
        ctr: m.avgCtr,
      }));

      const generatedInsights = await generateAdInsights(metricsForAI);

      // Store generated insights
      const stored = await db
        .insert(aiInsights)
        .values(
          generatedInsights.map((insight) => ({
            platform: null,
            title: insight.title,
            content: insight.content,
            category: insight.category,
            confidence: insight.confidence,
            actionable: insight.actionable,
          }))
        )
        .returning();

      return NextResponse.json(stored);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const [insight] = await db
      .update(aiInsights)
      .set({ dismissed: true })
      .where(eq(aiInsights.id, id))
      .returning();

    return NextResponse.json(insight);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
