import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents, activityLogs, alerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active agents
    const activeAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.status, "active"));

    const now = new Date();
    const results = [];

    for (const agent of activeAgents) {
      try {
        // Update heartbeat
        await db
          .update(agents)
          .set({ lastHeartbeat: now })
          .where(eq(agents.id, agent.id));

        // Simulate agent activity based on type
        let activityTitle = "";
        let activityDesc = "";
        let activityType: "action" | "analysis" | "alert" | "optimization" | "content" = "action";

        switch (agent.type) {
          case "monitor":
            activityTitle = "Scheduled performance check completed";
            activityDesc = "All monitored metrics within acceptable ranges. No anomalies detected.";
            activityType = "analysis";
            break;
          case "optimizer":
            activityTitle = "Bid optimization cycle executed";
            activityDesc = `Reviewed and adjusted bids for ${Math.floor(Math.random() * 20) + 5} ad sets.`;
            activityType = "optimization";
            break;
          case "content_generator":
            activityTitle = "Scheduled content refresh";
            activityDesc = "Analyzed top-performing creatives and queued new variants for testing.";
            activityType = "content";
            break;
          case "competitor":
            activityTitle = "Competitor intelligence update";
            activityDesc = "Scanned competitor ad libraries and updated tracking data.";
            activityType = "analysis";
            break;
        }

        await db.insert(activityLogs).values({
          agentId: agent.id,
          type: activityType,
          platform: agent.platform,
          title: activityTitle,
          description: activityDesc,
          metadata: { heartbeat: true, timestamp: now.toISOString() },
        });

        // Update tasks completed
        await db
          .update(agents)
          .set({ tasksCompleted: (agent.tasksCompleted || 0) + 1 })
          .where(eq(agents.id, agent.id));

        results.push({ agentId: agent.id, agentName: agent.name, status: "success" });
      } catch (agentError) {
        // Mark agent as error
        await db
          .update(agents)
          .set({ status: "error" })
          .where(eq(agents.id, agent.id));

        await db.insert(alerts).values({
          agentId: agent.id,
          platform: agent.platform,
          severity: "critical",
          title: `Agent heartbeat failed: ${agent.name}`,
          description: String(agentError),
        });

        results.push({ agentId: agent.id, agentName: agent.name, status: "error", error: String(agentError) });
      }
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      agentsProcessed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
