import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents, activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.agentId, id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(20);

    return NextResponse.json({ agent, logs });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [agent] = await db
      .update(agents)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(agents).where(eq(agents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
