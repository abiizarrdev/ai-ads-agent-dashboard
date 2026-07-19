import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    // Check if already seeded
    const existingAgents = await db.select().from(agents).limit(1);
    if (existingAgents.length > 0) {
      return NextResponse.json({ message: "Database already seeded", skipped: true });
    }

    await seedDatabase();
    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
