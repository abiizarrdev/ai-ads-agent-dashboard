import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, agents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const allAlerts = await db
      .select({
        id: alerts.id,
        agentId: alerts.agentId,
        agentName: agents.name,
        platform: alerts.platform,
        severity: alerts.severity,
        title: alerts.title,
        description: alerts.description,
        resolved: alerts.resolved,
        resolvedAt: alerts.resolvedAt,
        metadata: alerts.metadata,
        createdAt: alerts.createdAt,
      })
      .from(alerts)
      .leftJoin(agents, eq(alerts.agentId, agents.id))
      .orderBy(desc(alerts.createdAt))
      .limit(50);

    return NextResponse.json(allAlerts);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, resolved } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const [alert] = await db
      .update(alerts)
      .set({
        resolved: resolved ?? true,
        resolvedAt: resolved ? new Date() : null,
      })
      .where(eq(alerts.id, id))
      .returning();

    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
