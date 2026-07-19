import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateAdCopy, generateOptimizationRecommendations } from "@/lib/cerebras";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, agentId, platform, product, audience, tone, metrics } = body;

    if (type === "ad_copy") {
      if (!platform || !product) {
        return NextResponse.json({ error: "Platform and product are required" }, { status: 400 });
      }

      const copies = await generateAdCopy({
        platform: platform || "google_ads",
        product: product || "AI Marketing Tool",
        audience: audience || "Marketing professionals",
        tone: tone || "professional",
      });

      // Log the activity if agentId provided
      if (agentId) {
        await db.insert(activityLogs).values({
          agentId,
          type: "content",
          platform,
          title: `Generated ${copies.length} ad copy variants`,
          description: `Created ad copy for ${platform} targeting ${audience}`,
          metadata: { copies },
        });
      }

      return NextResponse.json({ copies });
    }

    if (type === "optimization") {
      if (!agentId) {
        return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
      }

      const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }

      const recommendations = await generateOptimizationRecommendations({
        agentType: agent.type,
        platform: platform || agent.platform || "google_ads",
        metrics: metrics || {},
      });

      await db.insert(activityLogs).values({
        agentId,
        type: "optimization",
        platform: platform || agent.platform,
        title: "Generated optimization recommendations",
        description: recommendations[0] || "AI-powered optimization analysis complete",
        metadata: { recommendations },
      });

      return NextResponse.json({ recommendations });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
