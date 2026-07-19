CREATE TYPE "public"."activity_type" AS ENUM('action', 'analysis', 'alert', 'optimization', 'content');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('active', 'paused', 'error', 'idle');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('monitor', 'optimizer', 'content_generator', 'competitor');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('google_ads', 'meta_ads', 'tiktok_ads');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"type" "activity_type" DEFAULT 'action' NOT NULL,
	"platform" "platform",
	"title" varchar(500) NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "agent_type" NOT NULL,
	"status" "agent_status" DEFAULT 'idle' NOT NULL,
	"platform" "platform",
	"description" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"last_heartbeat" timestamp,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"success_rate" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform",
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(100),
	"confidence" real DEFAULT 0.8 NOT NULL,
	"actionable" boolean DEFAULT true NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"platform" "platform",
	"severity" "alert_severity" DEFAULT 'info' NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"campaign_name" varchar(255) NOT NULL,
	"campaign_id" varchar(255),
	"spend" real DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"roas" real DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0 NOT NULL,
	"cpc" real DEFAULT 0 NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"account_name" varchar(255),
	"account_id" varchar(255),
	"composio_connection_id" varchar(255),
	"scopes" text[],
	"connected_at" timestamp,
	"last_sync_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_connections_platform_unique" UNIQUE("platform")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;