import { NextResponse } from "next/server";
import { db } from "@/db";
import { 
  agents, 
  activityLogs, 
  alerts, 
  campaignMetrics, 
  platformConnections, 
  aiInsights 
} from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("Resetting all tables in Supabase...");

    // Delete all records from all tables
    await db.delete(activityLogs);
    await db.delete(alerts);
    await db.delete(campaignMetrics);
    await db.delete(aiInsights);
    await db.delete(agents);
    
    // For platform_connections, instead of deleting, reset connected to false
    await db.delete(platformConnections);
    
    // Seed default disconnected platform connection entries
    await db.insert(platformConnections).values([
      {
        platform: "google_ads",
        connected: false,
        accountName: null,
        accountId: null,
        composioConnectionId: null,
        scopes: [],
      },
      {
        platform: "meta_ads",
        connected: false,
        accountName: null,
        accountId: null,
        composioConnectionId: null,
        scopes: [],
      },
      {
        platform: "tiktok_ads",
        connected: false,
        accountName: null,
        accountId: null,
        composioConnectionId: null,
        scopes: [],
      }
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "All dummy data cleared. Platforms connections reset to disconnected. Database is now clean!" 
    });
  } catch (error) {
    console.error("Reset failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
