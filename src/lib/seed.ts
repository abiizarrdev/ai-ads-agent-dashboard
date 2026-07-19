import { db } from "@/db";
import { agents, activityLogs, alerts, campaignMetrics, platformConnections, aiInsights } from "@/db/schema";
import { subDays, subHours, subMinutes } from "date-fns";

export async function seedDatabase() {
  // Seed platform connections
  await db.insert(platformConnections).values([
    {
      platform: "google_ads",
      connected: true,
      accountName: "Acme Corp - Google Ads",
      accountId: "123-456-7890",
      composioConnectionId: "comp_google_001",
      scopes: ["ads.readonly", "ads.write"],
      connectedAt: subDays(new Date(), 15),
      lastSyncAt: subMinutes(new Date(), 30),
    },
    {
      platform: "meta_ads",
      connected: true,
      accountName: "Acme Corp - Meta Business",
      accountId: "act_987654321",
      composioConnectionId: "comp_meta_001",
      scopes: ["ads_management", "ads_read"],
      connectedAt: subDays(new Date(), 10),
      lastSyncAt: subMinutes(new Date(), 45),
    },
    {
      platform: "tiktok_ads",
      connected: false,
      accountName: null,
      accountId: null,
      composioConnectionId: null,
    },
  ]).onConflictDoNothing();

  // Seed agents
  const agentRows = await db.insert(agents).values([
    {
      name: "Google Campaign Monitor",
      type: "monitor",
      status: "active",
      platform: "google_ads",
      description: "Continuously monitors Google Ads campaigns for performance anomalies and budget pacing.",
      config: { checkInterval: 15, alertThreshold: 0.2, budgetPacing: true },
      lastHeartbeat: subMinutes(new Date(), 8),
      tasksCompleted: 1284,
      successRate: 0.97,
    },
    {
      name: "Meta Bid Optimizer",
      type: "optimizer",
      status: "active",
      platform: "meta_ads",
      description: "Automatically adjusts Meta Ads bids based on conversion data and target ROAS.",
      config: { targetRoas: 4.0, maxBidIncrease: 0.25, optimizationWindow: "7d" },
      lastHeartbeat: subMinutes(new Date(), 12),
      tasksCompleted: 892,
      successRate: 0.94,
    },
    {
      name: "Creative Content Generator",
      type: "content_generator",
      status: "active",
      platform: null,
      description: "Generates AI-powered ad copy and creative briefs for all platforms using Cerebras.",
      config: { model: "llama-3.3-70b", dailyLimit: 50, platforms: ["google_ads", "meta_ads", "tiktok_ads"] },
      lastHeartbeat: subMinutes(new Date(), 5),
      tasksCompleted: 347,
      successRate: 0.91,
    },
    {
      name: "TikTok Competitor Tracker",
      type: "competitor",
      status: "paused",
      platform: "tiktok_ads",
      description: "Tracks competitor ad strategies on TikTok and reports emerging trends.",
      config: { competitors: ["competitor_a", "competitor_b"], trackingDepth: "deep" },
      lastHeartbeat: subHours(new Date(), 6),
      tasksCompleted: 156,
      successRate: 0.88,
    },
    {
      name: "Cross-Platform Budget Optimizer",
      type: "optimizer",
      status: "idle",
      platform: null,
      description: "Reallocates budget across platforms based on ROAS performance and market conditions.",
      config: { rebalanceFrequency: "daily", minBudget: 500, maxShift: 0.3 },
      lastHeartbeat: subHours(new Date(), 2),
      tasksCompleted: 89,
      successRate: 0.96,
    },
    {
      name: "Google Competitor Analyzer",
      type: "competitor",
      status: "error",
      platform: "google_ads",
      description: "Analyzes competitor keywords and bidding strategies on Google Ads.",
      config: { keywords: ["brand", "product", "category"], updateFrequency: "6h" },
      lastHeartbeat: subHours(new Date(), 3),
      tasksCompleted: 234,
      successRate: 0.82,
    },
  ]).returning();

  // Seed activity logs
  const agentIds = agentRows.map((a) => a.id);
  
  await db.insert(activityLogs).values([
    { agentId: agentIds[0], type: "analysis", platform: "google_ads", title: "Budget pacing check completed", description: "All campaigns pacing within 5% of target. Brand campaign slightly ahead.", createdAt: subMinutes(new Date(), 8) },
    { agentId: agentIds[1], type: "optimization", platform: "meta_ads", title: "Bids adjusted for 12 ad sets", description: "Increased bids on 8 high-performing ad sets, decreased 4 underperformers.", createdAt: subMinutes(new Date(), 22) },
    { agentId: agentIds[2], type: "content", platform: "google_ads", title: "Generated 5 new ad copy variants", description: "Created responsive search ad variations for Summer Sale campaign.", createdAt: subMinutes(new Date(), 35) },
    { agentId: agentIds[0], type: "alert", platform: "google_ads", title: "CTR drop detected on Brand campaign", description: "Brand campaign CTR fell 18% vs 7-day average. Investigating.", createdAt: subMinutes(new Date(), 45) },
    { agentId: agentIds[1], type: "analysis", platform: "meta_ads", title: "Audience overlap analysis", description: "Identified 34% overlap between Lookalike 1% and Interest audiences.", createdAt: subHours(new Date(), 1) },
    { agentId: agentIds[2], type: "content", platform: "tiktok_ads", title: "TikTok video script generated", description: "Created 3 UGC-style scripts for Gen Z audience segment.", createdAt: subHours(new Date(), 2) },
    { agentId: agentIds[4], type: "optimization", platform: "google_ads", title: "Budget reallocated: +$2,400 to Google", description: "Moved budget from Meta to Google based on 6.1x vs 3.8x ROAS comparison.", createdAt: subHours(new Date(), 3) },
    { agentId: agentIds[3], type: "analysis", platform: "tiktok_ads", title: "Competitor trend report", description: "Competitor A increased spend 40% on TikTok. Trending toward video ads.", createdAt: subHours(new Date(), 4) },
    { agentId: agentIds[0], type: "action", platform: "google_ads", title: "Negative keywords added", description: "Added 23 negative keywords to prevent wasted spend on irrelevant queries.", createdAt: subHours(new Date(), 5) },
    { agentId: agentIds[1], type: "optimization", platform: "meta_ads", title: "Campaign budget updated", description: "Increased Retargeting campaign daily budget from $500 to $650.", createdAt: subHours(new Date(), 6) },
  ]);

  // Seed alerts
  await db.insert(alerts).values([
    { agentId: agentIds[5], platform: "google_ads", severity: "critical", title: "API Connection Error", description: "Google Ads API returning 403 errors. Campaign data sync failed.", resolved: false, createdAt: subHours(new Date(), 3) },
    { agentId: agentIds[0], platform: "google_ads", severity: "warning", title: "Budget Pacing Behind", description: "Shopping campaign spending 22% below daily budget pace.", resolved: false, createdAt: subHours(new Date(), 2) },
    { agentId: agentIds[1], platform: "meta_ads", severity: "warning", title: "ROAS Below Target", description: "Prospecting campaign ROAS at 2.1x, below 3.0x target for 3 days.", resolved: false, createdAt: subDays(new Date(), 1) },
    { agentId: agentIds[0], platform: "google_ads", severity: "info", title: "New Converting Keyword", description: "Keyword 'best ai marketing tool' driving high-quality conversions.", resolved: true, resolvedAt: subHours(new Date(), 1), createdAt: subDays(new Date(), 2) },
    { agentId: agentIds[1], platform: "meta_ads", severity: "critical", title: "Ad Account Spending Limit", description: "Meta ad account approaching monthly spending limit. 85% utilized.", resolved: false, createdAt: subHours(new Date(), 1) },
  ]);

  // Seed campaign metrics (last 14 days)
  const metricsData = [];
  for (let i = 13; i >= 0; i--) {
    const date = subDays(new Date(), i);
    
    metricsData.push(
      { platform: "google_ads" as const, campaignName: "Brand Campaign", campaignId: "goog_001", spend: 1200 + Math.random() * 400, impressions: 45000 + Math.floor(Math.random() * 10000), clicks: 2100 + Math.floor(Math.random() * 500), conversions: 85 + Math.floor(Math.random() * 30), roas: 5.2 + Math.random() * 1.5, ctr: 0.047 + Math.random() * 0.01, cpc: 0.57 + Math.random() * 0.1, date },
      { platform: "google_ads" as const, campaignName: "Shopping Campaign", campaignId: "goog_002", spend: 2800 + Math.random() * 600, impressions: 120000 + Math.floor(Math.random() * 20000), clicks: 4500 + Math.floor(Math.random() * 800), conversions: 140 + Math.floor(Math.random() * 40), roas: 4.1 + Math.random() * 0.8, ctr: 0.038 + Math.random() * 0.008, cpc: 0.62 + Math.random() * 0.1, date },
      { platform: "meta_ads" as const, campaignName: "Prospecting", campaignId: "meta_001", spend: 1800 + Math.random() * 400, impressions: 180000 + Math.floor(Math.random() * 30000), clicks: 3200 + Math.floor(Math.random() * 600), conversions: 65 + Math.floor(Math.random() * 20), roas: 2.8 + Math.random() * 0.6, ctr: 0.018 + Math.random() * 0.004, cpc: 0.56 + Math.random() * 0.1, date },
      { platform: "meta_ads" as const, campaignName: "Retargeting", campaignId: "meta_002", spend: 950 + Math.random() * 200, impressions: 45000 + Math.floor(Math.random() * 8000), clicks: 2800 + Math.floor(Math.random() * 400), conversions: 95 + Math.floor(Math.random() * 25), roas: 5.8 + Math.random() * 1.2, ctr: 0.062 + Math.random() * 0.01, cpc: 0.34 + Math.random() * 0.08, date },
      { platform: "tiktok_ads" as const, campaignName: "Awareness", campaignId: "tik_001", spend: 600 + Math.random() * 200, impressions: 250000 + Math.floor(Math.random() * 50000), clicks: 1800 + Math.floor(Math.random() * 400), conversions: 28 + Math.floor(Math.random() * 12), roas: 1.9 + Math.random() * 0.5, ctr: 0.007 + Math.random() * 0.003, cpc: 0.33 + Math.random() * 0.08, date },
    );
  }
  
  await db.insert(campaignMetrics).values(metricsData);

  // Seed AI insights
  await db.insert(aiInsights).values([
    { platform: "google_ads", title: "Scale Brand Campaign Budget", content: "Your Brand campaign is delivering 6.1x ROAS consistently over 14 days. Increasing daily budget by 30% could yield an additional $8,400 in monthly revenue at current efficiency.", category: "Budget", confidence: 0.94, actionable: true },
    { platform: "meta_ads", title: "Prospecting Audience Refresh Needed", content: "Meta Prospecting campaign frequency has reached 4.2x — your audience is seeing ads too often. Expand targeting or introduce fresh creatives to combat saturation.", category: "Audience", confidence: 0.88, actionable: true },
    { platform: null, title: "TikTok Underutilized Channel", content: "Based on competitor analysis, brands in your vertical are allocating 25-35% of budgets to TikTok. Your current 8% allocation may be leaving conversions on the table.", category: "Strategy", confidence: 0.76, actionable: true },
    { platform: "google_ads", title: "Negative Keyword Gap", content: "Analysis reveals 127 search terms triggering ads with 0 conversions over 30 days, wasting an estimated $1,840. Adding these as negatives could improve campaign efficiency.", category: "Performance", confidence: 0.91, actionable: true },
  ]);
}
