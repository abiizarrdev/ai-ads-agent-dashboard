import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, agents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const logs = await db
      .select({
        id: activityLogs.id,
        agentId: activityLogs.agentId,
        agentName: agents.name,
        agentType: agents.type,
        type: activityLogs.type,
        platform: activityLogs.platform,
        title: activityLogs.title,
        description: activityLogs.description,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .leftJoin(agents, eq(activityLogs.agentId, agents.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(50);

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
