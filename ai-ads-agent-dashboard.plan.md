# Plan: AI Ads Agent Dashboard — Full Implementation

## Summary
The frontend codebase is **complete and working** — all pages, components, API routes, DB schema, seed data, Cerebras integration, and Vercel Cron are already implemented in the zip. The implementation task is to **transplant this frontend into a production environment**: scaffold the project from the zip, provision a PostgreSQL database, run migrations, wire environment variables, seed data, and deploy to Vercel. No new application code needs to be invented — the plan tracks *where* each piece goes, *which env vars* are required, and *the exact order* of operations to get from zip → running deployment.

## User Story
As a solo operator managing Google Ads, Meta Ads, and TikTok Ads,
I want the dashboard deployed and connected to a real database,
So that I can monitor campaigns, manage AI agents, and view analytics in one place.

## Problem → Solution
Zip archive with complete Next.js app → Running production deployment on Vercel backed by a provisioned PostgreSQL database, with all schema tables created, seed data loaded, env vars set, and Vercel Cron enabled.

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/prds/ai-ads-agent-dashboard.prd.md`
- **PRD Phase**: Milestone 1 (Supabase auth + Composio OAuth) → Milestone 7 (Vercel Cron)
- **Estimated Files**: 40 files already exist; 1–2 new env files; 0 net new application code files
- **Note**: Supabase is referenced in the PRD as an option but the existing codebase uses **direct PostgreSQL via Drizzle ORM + pg**. The plan follows the codebase, not the PRD's Supabase assumption. Supabase can be used as a hosted Postgres provider; its auth layer is not wired in the current code.

---

## UX Design

### Before
```
┌──────────────────────────────────┐
│  zip file sitting on disk        │
│  No DB • No env vars             │
│  No deployment                   │
│  "npm run dev" → crashes         │
└──────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────────────┐
│  https://your-app.vercel.app/dashboard               │
│                                                      │
│  ┌─────────┐  Overview: $47k spend  4.2x ROAS        │
│  │ Sidebar │  Agent Status: 4 active, 1 error        │
│  │ Dashboard│  Activity Feed: live updates            │
│  │ Agents  │  Alerts: 3 active, 1 critical           │
│  │ Analytics│                                        │
│  │ Alerts  │  Analytics: 14-day Recharts trends       │
│  │ Settings│  Settings: Composio OAuth connect        │
│  └─────────┘  Cron: /api/cron/heartbeat every 6h     │
└──────────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| App start | Crash — no DATABASE_URL | Loads dashboard | Env var required |
| Overview cards | Empty / error | Real seeded data | After seed step |
| Activity feed | 500 error | 30s polling, live entries | DB populated |
| Cron heartbeat | Not triggered | Fires every 6h | vercel.json already set |
| Settings connect | Simulated | Simulated + DB persisted | composioConnectionId stored |

---

## Mandatory Reading

Files that MUST be read before implementing (all already read above — listed for implementor reference):

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/db/index.ts` | all | DB connection pattern — global pool singleton |
| P0 | `src/db/schema.ts` | all | All 6 tables + enums + inferred types |
| P0 | `src/app/api/agents/route.ts` | all | API error pattern: `String(error)`, no AppError class |
| P0 | `vercel.json` | all | Cron schedule is already correct |
| P0 | `next.config.ts` | all | `serverComponentsExternalPackages` for Cerebras |
| P1 | `src/lib/cerebras.ts` | all | Singleton client, `CEREBRAS_API_KEY`, fallback data |
| P1 | `src/lib/seed.ts` | all | Full seed data — run once after migration |
| P1 | `src/app/api/cron/heartbeat/route.ts` | all | `CRON_SECRET` env var pattern |
| P2 | `src/components/dashboard/ActivityFeed.tsx` | all | Polling interval 30s, not SSE |
| P2 | `src/app/dashboard/settings/page.tsx` | all | Composio connection is simulated in current code |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| Drizzle migrations | drizzle-orm docs | Use `drizzle-kit push` for schema push or `drizzle-kit generate` + `migrate` |
| Vercel Cron | vercel.com/docs/cron-jobs | `vercel.json` crons array, Hobby plan: 2 crons max; Pro: 40 max |
| Cerebras SDK | cerebras.ai docs | Singleton pattern already implemented; `CEREBRAS_API_KEY` env var name |
| Next.js 16 params | nextjs.org | `params` in Route Handlers and pages is `Promise<{}>` — already handled in codebase |
| pg Pool | node-postgres docs | Pool is reused via `globalThis` singleton — already in `src/db/index.ts` |

---

## Patterns to Mirror

All patterns are from the actual codebase files.

### NAMING_CONVENTION
```typescript
// SOURCE: src/app/api/agents/route.ts:6-13
// Functions: PascalCase HTTP verbs (GET, POST, PATCH, DELETE)
// Variables: camelCase
// DB tables: camelCase imports, snake_case column names in schema
export async function GET() {
  try {
    const allAgents = await db.select().from(agents).orderBy(desc(agents.createdAt));
    return NextResponse.json(allAgents);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

### ERROR_HANDLING
```typescript
// SOURCE: src/app/api/agents/route.ts:37-39
// Pattern: try/catch, String(error) coercion, 500 status
// No custom AppError class — keep it simple
} catch (error) {
  return NextResponse.json({ error: String(error) }, { status: 500 });
}
```

### DB_CONNECTION
```typescript
// SOURCE: src/db/index.ts:10-22
// Global singleton Pool to avoid exhausting connections in dev HMR
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};
export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({
  connectionString: databaseUrl,
});
if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}
export const db = drizzle(pool);
```

### ENV_GUARD_PATTERN
```typescript
// SOURCE: src/db/index.ts:4-8
// Always guard env vars at module load time, throw immediately
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
```

### ROUTE_PARAMS_PATTERN
```typescript
// SOURCE: src/app/api/agents/[id]/route.ts:6-12
// Next.js 16: params is Promise<{id: string}> — must await
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
```

### CLIENT_COMPONENT_FETCH_PATTERN
```typescript
// SOURCE: src/components/dashboard/ActivityFeed.tsx:34-49
// useCallback for fetch fn, useEffect for mount + interval, no react-query
const fetchActivities = useCallback(() => {
  fetch("/api/activity")
    .then((r) => r.json())
    .then((d) => { setActivities(Array.isArray(d) ? d : []); setLoading(false); })
    .catch(() => setLoading(false));
}, []);

useEffect(() => {
  fetchActivities();
  const interval = setInterval(fetchActivities, 30000);
  return () => clearInterval(interval);
}, [fetchActivities]);
```

### LOADING_SKELETON_PATTERN
```typescript
// SOURCE: src/components/dashboard/OverviewCards.tsx:31-37
// Show SkeletonCard grid while loading — imported from LoadingSpinner
if (loading) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
```

### CARD_COMPONENT_PATTERN
```typescript
// SOURCE: src/components/ui/Card.tsx:13-33
// All surfaces use Card with: bg-white rounded-2xl border border-gray-100 shadow-sm
// padding prop: "none"|"sm"|"md"|"lg"
<Card padding="none">
  <div className="px-6 py-4 border-b border-gray-50"> {/* card header */} </div>
  <div className="p-6"> {/* card body */ } </div>
</Card>
```

### TAILWIND_DESIGN_TOKENS
```
// SOURCE: globals.css + throughout components
Background: bg-gray-50 (page), bg-white (cards)
Text:       text-gray-900 (primary), text-gray-500 (secondary), text-gray-400 (muted)
Border:     border-gray-100 (cards), border-gray-50 (dividers inside cards)
Radius:     rounded-2xl (cards, modals), rounded-xl (buttons, inputs), rounded-lg (smaller)
Shadow:     shadow-sm (cards), shadow-2xl (modals)
Active nav: bg-gray-900 text-white
Font:       Inter via Google Fonts
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `.env.local` | CREATE | Required env vars for local dev |
| `.env.example` | CREATE | Document env vars for reference |
| `drizzle.config.json` | UPDATE | Point to real DATABASE_URL (use env var, not hardcoded localhost) |
| `src/app/api/seed/route.ts` | VERIFY | Already exists — confirm it calls `seedDatabase()` |
| `src/components/dashboard/SeedButton.tsx` | VERIFY | Already exists — confirm it POSTs to /api/seed |

**All other 40+ files are complete — do not modify them.**

## NOT Building
- Supabase auth (not in codebase — current code has no auth layer at all)
- Supabase Realtime (codebase uses 30s polling, not WebSockets)
- Composio real OAuth redirect (current code simulates it — stubs in place)
- Any new React components
- Any new API routes
- Any new DB tables
- TypeScript type changes

---

## Step-by-Step Tasks

### Task 1: Extract and scaffold the project directory
- **ACTION**: Unzip the archive into your working directory
- **IMPLEMENT**: 
  ```bash
  unzip ai-ads-agent-dashboard.zip -d ai-ads-agent-dashboard
  cd ai-ads-agent-dashboard
  npm install
  ```
- **MIRROR**: No pattern needed — standard scaffolding
- **IMPORTS**: N/A
- **GOTCHA**: The `package.json` name is `"nextjs-postgresql-template"` — this is the template name, not the app name. It does not affect functionality. Do not rename unless you want to.
- **VALIDATE**: `ls src/app src/components src/db src/lib` — should list all subdirectories

### Task 2: Provision a PostgreSQL database
- **ACTION**: Create a PostgreSQL database (local or cloud)
- **IMPLEMENT** (choose one):
  - **Local (Docker)**:
    ```bash
    docker run -d --name adsdb -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -p 5432:5432 postgres:16
    # Connection string: postgresql://postgres:postgres@localhost:5432/app_db
    ```
  - **Neon (free cloud Postgres)**:
    - Go to https://neon.tech → New project → copy connection string
    - Connection string format: `postgresql://user:pass@host/dbname?sslmode=require`
  - **Supabase (free cloud Postgres)**:
    - Go to https://supabase.com → New project → Settings → Database → copy URI
    - Use the "URI" format, not the pooler, for Drizzle compatibility
  - **Railway / PlanetScale**: similar — copy the `DATABASE_URL` from the project settings
- **MIRROR**: ENV_GUARD_PATTERN — `DATABASE_URL` is required or app throws at startup
- **IMPORTS**: N/A
- **GOTCHA**: For Neon/Supabase cloud, append `?sslmode=require` to the connection string. The pg Pool will fail silently without it on SSL-required hosts.
- **VALIDATE**: `psql "$DATABASE_URL" -c "SELECT 1"` — should return `1`

### Task 3: Create environment variables file
- **ACTION**: Create `.env.local` at project root
- **IMPLEMENT**:
  ```bash
  # .env.local
  # Required
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db

  # Optional — Cerebras AI (fallback data used if missing)
  CEREBRAS_API_KEY=your_cerebras_api_key_here

  # Optional — Vercel Cron security (set to any random string)
  CRON_SECRET=your_random_secret_here
  ```
  Get Cerebras API key free at: https://cloud.cerebras.ai (click "API Keys")
- **MIRROR**: ENV_GUARD_PATTERN from `src/db/index.ts:4-8`
- **IMPORTS**: N/A
- **GOTCHA 1**: `.env.local` is already in `.gitignore` in Next.js projects — do NOT commit it. 
- **GOTCHA 2**: `CEREBRAS_API_KEY` is optional — if missing, `src/lib/cerebras.ts:8` falls back to `"demo_key"` which will 401, but the catch block returns `getFallbackInsights()` / `getFallbackAdCopy()` — so the app still works with static fallback data.
- **GOTCHA 3**: `CRON_SECRET` is optional — if not set, cron check at `src/app/api/cron/heartbeat/route.ts:12` passes (the `cronSecret &&` guard is falsy).
- **VALIDATE**: `cat .env.local` — confirm DATABASE_URL is set

### Task 4: Update drizzle.config.json to use env var
- **ACTION**: Update `drizzle.config.json` to read DATABASE_URL from environment
- **IMPLEMENT**: Replace the hardcoded localhost URL:
  ```json
  {
    "dialect": "postgresql",
    "schema": "./src/db/schema.ts",
    "dbCredentials": {
      "url": "${DATABASE_URL}"
    }
  }
  ```
  Or use the `.ts` config format for full env support:
  ```bash
  # Rename drizzle.config.json → drizzle.config.ts
  ```
  ```typescript
  // drizzle.config.ts
  import type { Config } from "drizzle-kit";

  export default {
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  } satisfies Config;
  ```
- **MIRROR**: ENV_GUARD_PATTERN
- **IMPORTS**: `import type { Config } from "drizzle-kit"`
- **GOTCHA**: `drizzle-kit` v0.31 supports env var interpolation in JSON but it's safer to use the `.ts` config. If keeping JSON, load with `dotenv` pre-script.
- **VALIDATE**: `DATABASE_URL=your_url npx drizzle-kit push --config drizzle.config.ts` — should succeed

### Task 5: Run database migrations / schema push
- **ACTION**: Create all 6 tables in the database
- **IMPLEMENT**:
  ```bash
  # Option A: Push schema directly (recommended for first deploy, no migration files)
  npx drizzle-kit push

  # Option B: Generate migration SQL then run it
  npx drizzle-kit generate
  npx drizzle-kit migrate
  ```
  Tables that will be created:
  - `agents` — with enums: `agent_type`, `agent_status`, `platform`, `alert_severity`, `activity_type`
  - `activity_logs`
  - `alerts`
  - `campaign_metrics`
  - `platform_connections`
  - `ai_insights`
- **MIRROR**: DB_CONNECTION_PATTERN (uses pg Pool)
- **IMPORTS**: N/A
- **GOTCHA 1**: Drizzle enums must be created before the tables that reference them. `drizzle-kit push` handles this automatically.
- **GOTCHA 2**: `platform_connections` has `platform` as `unique()` — the seed data uses `.onConflictDoNothing()` to handle re-seeding.
- **VALIDATE**: 
  ```bash
  psql "$DATABASE_URL" -c "\dt"
  # Should list: agents, activity_logs, alerts, campaign_metrics, platform_connections, ai_insights
  ```

### Task 6: Verify seed API route and SeedButton component
- **ACTION**: Confirm `src/app/api/seed/route.ts` exists and correctly calls `seedDatabase()`
- **IMPLEMENT**: Read the file. It should look like:
  ```typescript
  // src/app/api/seed/route.ts — expected content
  import { NextResponse } from "next/server";
  import { seedDatabase } from "@/lib/seed";

  export async function POST() {
    try {
      await seedDatabase();
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }
  ```
  Also verify `src/components/dashboard/SeedButton.tsx` POSTs to `/api/seed`.
- **MIRROR**: ERROR_HANDLING pattern
- **IMPORTS**: `import { seedDatabase } from "@/lib/seed"`
- **GOTCHA**: `seedDatabase()` uses `subDays`, `subHours`, `subMinutes` from `date-fns` — already in `package.json`. The seed inserts 70 campaign metric rows (5 platforms × 14 days).
- **VALIDATE**: After running dev server, click "Seed Data" button on dashboard. Check DB:
  ```bash
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM agents;"
  # Expect: 6
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM campaign_metrics;"
  # Expect: 70
  ```

### Task 7: Run local development server
- **ACTION**: Start the dev server and verify all pages load
- **IMPLEMENT**:
  ```bash
  npm run dev
  # Open http://localhost:3000
  ```
- **MIRROR**: All client components use `useEffect` + `fetch` pattern
- **IMPORTS**: N/A
- **GOTCHA 1**: Root page (`/`) redirects to `/dashboard` via `src/app/page.tsx:3`.
- **GOTCHA 2**: `next.config.ts` sets `serverComponentsExternalPackages: ["@cerebras/cerebras_cloud_sdk"]` — required for Cerebras to work in API routes (server-side only). Do not remove.
- **GOTCHA 3**: Activity feed polls every 30 seconds (`setInterval(fetchActivities, 30000)`) — this is by design, not a bug. There is no SSE/WebSocket.
- **VALIDATE**: Navigate to all 5 pages and confirm no 500 errors:
  - `/dashboard` — Overview cards, charts, activity feed
  - `/dashboard/agents` — Agent grid with create/pause/delete
  - `/dashboard/analytics` — Recharts line/pie/bar charts + AI insights
  - `/dashboard/alerts` — Alert list with resolve actions
  - `/dashboard/settings` — Platform connections + AI copy generator

### Task 8: Type-check and lint
- **ACTION**: Run TypeScript type checker and ESLint
- **IMPLEMENT**:
  ```bash
  npm run typecheck   # runs tsc --noEmit
  npm run lint        # runs eslint .
  ```
- **MIRROR**: All components use explicit TypeScript interfaces (see `src/app/dashboard/agents/page.tsx:27-32`, `src/components/dashboard/ActivityFeed.tsx:10-20`)
- **IMPORTS**: N/A
- **GOTCHA 1**: There are 2 intentional `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in `src/lib/cerebras.ts:57,105,145` for the Cerebras SDK response typing. These are expected — the SDK's TypeScript types are incomplete.
- **GOTCHA 2**: `next.config.ts` uses `serverComponentsExternalPackages` which is experimental in Next.js 16 — TypeScript may warn but it will not break the build.
- **VALIDATE**: Zero type errors. ESLint warnings about `any` in cerebras.ts are pre-existing and acceptable.

### Task 9: Deploy to Vercel
- **ACTION**: Deploy the full project to Vercel with Cron enabled
- **IMPLEMENT**:
  ```bash
  # Option A: Via Vercel CLI
  npm install -g vercel
  vercel login
  vercel --prod

  # Option B: Via GitHub
  # Push to GitHub → Import project at vercel.com/new → Deploy
  ```
  After initial deploy:
  1. Go to Vercel project → **Settings → Environment Variables**
  2. Add:
     - `DATABASE_URL` = your cloud Postgres connection string
     - `CEREBRAS_API_KEY` = your key (optional)
     - `CRON_SECRET` = your secret (optional)
  3. **Redeploy** (Vercel requires a redeploy after adding env vars)
- **MIRROR**: Cron is already configured in `vercel.json:2-7` (`0 */6 * * *`)
- **IMPORTS**: N/A
- **GOTCHA 1**: Vercel Hobby plan allows **2 cron jobs**. The project only uses 1 (`/api/cron/heartbeat`) — within limits.
- **GOTCHA 2**: Vercel Cron sends a GET request with `Authorization: Bearer $CRON_SECRET` header. The heartbeat route checks this at `src/app/api/cron/heartbeat/route.ts:9-14`. If `CRON_SECRET` is not set on Vercel, the check passes (falsy guard).
- **GOTCHA 3**: `DATABASE_URL` for cloud Postgres (Neon/Supabase) needs `?sslmode=require`. Without it, Vercel serverless functions will fail to connect.
- **GOTCHA 4**: After deploying, run the seed once by visiting your deployed URL and clicking **"Seed Data"** button on the dashboard, or `POST https://your-app.vercel.app/api/seed`.
- **VALIDATE**:
  - `https://your-app.vercel.app/dashboard` loads with real data
  - `https://your-app.vercel.app/api/health` returns `{"ok": true}` (if health route exists)
  - Vercel Cron tab shows next scheduled run

### Task 10: Verify Vercel Cron heartbeat
- **ACTION**: Confirm the cron job is registered and test it manually
- **IMPLEMENT**:
  ```bash
  # Manual test of heartbeat endpoint (mimics what Vercel Cron does)
  curl -X GET https://your-app.vercel.app/api/cron/heartbeat \
    -H "Authorization: Bearer $CRON_SECRET"

  # Expected response:
  # {
  #   "timestamp": "2026-07-19T...",
  #   "agentsProcessed": 4,
  #   "results": [
  #     { "agentId": "...", "agentName": "Google Campaign Monitor", "status": "success" },
  #     ...
  #   ]
  # }
  ```
- **MIRROR**: CRON pattern from `src/app/api/cron/heartbeat/route.ts`
- **IMPORTS**: N/A
- **GOTCHA**: The heartbeat only processes agents with `status = "active"`. After seeding, 3 agents are active. The paused, idle, and error agents are skipped.
- **VALIDATE**: 
  - Response shows `agentsProcessed: 3` (or 4 if you activate the optimizer)
  - DB: `SELECT last_heartbeat FROM agents WHERE status = 'active'` — timestamps updated
  - Activity logs: new entries appear with `metadata: { heartbeat: true }`

---

## Testing Strategy

### Manual Smoke Tests (no automated tests exist in the codebase)

| Test | Action | Expected Output | Critical? |
|---|---|---|---|
| DB connection | Start dev server | No "DATABASE_URL is required" error | Yes |
| Seed data | Click "Seed Data" button | Dashboard shows data | Yes |
| Overview cards | Load /dashboard | 4 stat cards with numbers | Yes |
| Agent list | Load /agents | 6 agent cards | Yes |
| Create agent | Click "New Agent", fill form | New card appears | Yes |
| Pause agent | Click Pause on active agent | Status changes to Paused | Yes |
| Delete agent | Click trash, confirm | Card disappears | Yes |
| Agent detail | Click "View" on agent | Detail page with logs | Yes |
| AI recommendations | Click "AI Optimize" | 3 recommendations show | Yes |
| Analytics charts | Load /analytics | Line + pie + bar charts | Yes |
| AI insights | Click "Regenerate" | 3 insight cards appear | Yes |
| Alerts list | Load /alerts | Alert cards with severity badges | Yes |
| Resolve alert | Click "Resolve" | Alert moves to resolved | Yes |
| Settings connect | Click "Connect via Composio" | Modal + save to DB | Yes |
| Settings disconnect | Click "Disconnect" | Platform shows "Not connected" | Yes |
| Ad copy generator | Enter product, click "Generate" | 3 copy variants | Yes |
| Cron heartbeat | POST /api/cron/heartbeat | `agentsProcessed` > 0 | Yes |
| Activity feed | Wait 30s | Feed refreshes | Yes |
| Responsive layout | Resize to 375px | Sidebar collapses gracefully | No |

### Edge Cases Checklist
- [ ] Empty database (no seed) — all pages show empty states without crashing
- [ ] CEREBRAS_API_KEY missing — AI features return fallback data, no 500
- [ ] Agent not found at /agents/nonexistent-id — "Agent not found" state shown
- [ ] DELETE agent clears activity logs (cascade) — verify in DB
- [ ] platform_connections with duplicate platform — `onConflictDoNothing()` in seed handles it

---

## Validation Commands

### Static Analysis
```bash
# TypeScript type check
npm run typecheck
```
EXPECT: Zero errors (2 pre-existing eslint-disable comments in cerebras.ts are fine)

```bash
# Lint
npm run lint
```
EXPECT: No errors (warnings about `any` in cerebras.ts are pre-existing)

### Build Verification
```bash
npm run build
```
EXPECT: Build succeeds, no type or compilation errors

### Database Validation
```bash
# Check all tables exist
psql "$DATABASE_URL" -c "\dt"
# Expect: agents, activity_logs, alerts, ai_insights, campaign_metrics, platform_connections

# Check enums
psql "$DATABASE_URL" -c "\dT"
# Expect: agent_status, agent_type, activity_type, alert_severity, platform

# Check seed data
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM agents;"
# Expect: 6

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM campaign_metrics;"
# Expect: 70 (5 campaigns × 14 days)
```

### API Validation
```bash
# Local: test each API route
curl http://localhost:3000/api/agents | jq 'length'        # Expect: 6
curl http://localhost:3000/api/metrics | jq '.overview'    # Expect: object with totals
curl http://localhost:3000/api/alerts | jq 'length'        # Expect: 5
curl http://localhost:3000/api/connections | jq 'length'   # Expect: 3
curl http://localhost:3000/api/activity | jq 'length'      # Expect: 10
curl http://localhost:3000/api/insights | jq 'length'      # Expect: 4
```

### Browser Validation
```bash
npm run dev
# Open http://localhost:3000/dashboard
# Verify: stat cards show numbers (not 0 or N/A)
# Verify: charts render
# Verify: agent cards show 6 agents
```

### Manual Validation Checklist
- [ ] `npm install` completes without errors
- [ ] `.env.local` created with `DATABASE_URL`
- [ ] `npx drizzle-kit push` creates all tables
- [ ] `npm run dev` starts without errors
- [ ] Dashboard loads at http://localhost:3000
- [ ] Seed Data button clicked — data populates
- [ ] All 5 nav pages load without 500 errors
- [ ] `npm run build` succeeds
- [ ] Vercel project created and deployed
- [ ] Env vars added on Vercel
- [ ] Redeployed after env vars added
- [ ] Production URL loads dashboard with data
- [ ] Cron heartbeat tested manually via curl
- [ ] Vercel Cron tab shows scheduled job

---

## Acceptance Criteria
- [ ] All 5 dashboard pages load without 500 errors (local and production)
- [ ] Database has all 6 tables with seed data
- [ ] AI insights and ad copy generator work (real or fallback)
- [ ] Agent CRUD (create, pause, activate, delete) works end-to-end
- [ ] Vercel Cron heartbeat fires and updates `last_heartbeat` timestamps
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Completion Checklist
- [ ] No hardcoded secrets in any committed file
- [ ] `.env.local` is gitignored
- [ ] `drizzle.config.json` or `drizzle.config.ts` reads `DATABASE_URL` from env
- [ ] Production DATABASE_URL uses `?sslmode=require` (cloud Postgres)
- [ ] Vercel env vars set before final deployment
- [ ] Seed data loaded in production
- [ ] Cron secret set consistently in `.env.local` and Vercel env vars
- [ ] No unnecessary files added beyond what the plan specifies

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cloud Postgres SSL required but missing from URL | Medium | High — app fails to start | Always append `?sslmode=require` to Neon/Supabase URLs |
| Cerebras API key invalid or rate limited | Low | Low — fallback data serves correctly | App degrades gracefully; fallback data is realistic |
| Vercel free tier Cron limits | Low | Low — only 1 cron used | Hobby plan allows 2; well within limit |
| `drizzle-kit push` fails on enum already exists | Medium | Medium — migration fails | Drop and recreate DB, or use `drizzle-kit push --force` |
| `date-fns` subDays etc. generate timestamps in wrong timezone | Low | Low — cosmetic | Seed data uses UTC; display via `timeAgo()` is relative, timezone-safe |
| Next.js 16 `params` Promise change breaks anything | Very Low | — | Already handled in all route handlers with `await params` |

## Notes

### What the codebase already has (no new code needed)
- All 5 dashboard pages: `/dashboard`, `/agents`, `/agents/[id]`, `/analytics`, `/alerts`, `/settings`
- All 9 API routes: `agents`, `agents/[id]`, `activity`, `alerts`, `connections`, `cron/heartbeat`, `generate-content`, `insights`, `metrics`, `seed`, `health`
- Complete Drizzle schema with 6 tables and 5 enums
- Cerebras integration with real AI + fallback data
- Recharts charts: LineChart, AreaChart, PieChart, BarChart
- Modal, Card, Button, Badge, LoadingSpinner, SkeletonCard UI primitives
- Sidebar with active-path detection, Header with refresh/notifications
- Inter font via Google Fonts
- Tailwind 4.x with custom animations in globals.css
- 30s polling activity feed (no SSE — intentional)
- Vercel Cron configured in `vercel.json`
- Seed data with realistic campaign metrics, 6 agents, 5 alerts, 10 activity logs, 4 AI insights

### What is simulated (stubs to be aware of)
- **Composio OAuth**: Settings page shows "Connect via Composio" but it stores a fake `composioConnectionId` (`comp_{platform}_{timestamp}`) instead of doing a real OAuth redirect. Real Composio integration requires their SDK and OAuth redirect flow — out of scope for v1.
- **Platform API data**: All campaign metrics come from the seed file with randomized numbers, not real ad platform API calls.
- **TikTok connection**: Seeded as `connected: false` by default.
