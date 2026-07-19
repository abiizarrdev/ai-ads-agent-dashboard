import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const agentTypeEnum = pgEnum("agent_type", [
  "monitor",
  "optimizer",
  "content_generator",
  "competitor",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "paused",
  "error",
  "idle",
]);

export const platformEnum = pgEnum("platform", [
  "google_ads",
  "meta_ads",
  "tiktok_ads",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "action",
  "analysis",
  "alert",
  "optimization",
  "content",
]);

// Agents table
export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: agentTypeEnum("type").notNull(),
  status: agentStatusEnum("status").notNull().default("idle"),
  platform: platformEnum("platform"),
  description: text("description"),
  config: jsonb("config").default({}),
  lastHeartbeat: timestamp("last_heartbeat"),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  successRate: real("success_rate").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull().default("action"),
  platform: platformEnum("platform"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alerts
export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  platform: platformEnum("platform"),
  severity: alertSeverityEnum("severity").notNull().default("info"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Campaign metrics (snapshots stored periodically)
export const campaignMetrics = pgTable("campaign_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: platformEnum("platform").notNull(),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  campaignId: varchar("campaign_id", { length: 255 }),
  spend: real("spend").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  roas: real("roas").notNull().default(0),
  ctr: real("ctr").notNull().default(0),
  cpc: real("cpc").notNull().default(0),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Platform connections (Composio OAuth)
export const platformConnections = pgTable("platform_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: platformEnum("platform").notNull().unique(),
  connected: boolean("connected").notNull().default(false),
  accountName: varchar("account_name", { length: 255 }),
  accountId: varchar("account_id", { length: 255 }),
  composioConnectionId: varchar("composio_connection_id", { length: 255 }),
  scopes: text("scopes").array(),
  connectedAt: timestamp("connected_at"),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Generated Insights
export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: platformEnum("platform"),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  confidence: real("confidence").notNull().default(0.8),
  actionable: boolean("actionable").notNull().default(true),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type CampaignMetric = typeof campaignMetrics.$inferSelect;
export type NewCampaignMetric = typeof campaignMetrics.$inferInsert;
export type PlatformConnection = typeof platformConnections.$inferSelect;
export type NewPlatformConnection = typeof platformConnections.$inferInsert;
export type AiInsight = typeof aiInsights.$inferSelect;
export type NewAiInsight = typeof aiInsights.$inferInsert;
