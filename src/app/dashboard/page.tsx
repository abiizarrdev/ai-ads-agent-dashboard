import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { AgentStatusBoard } from "@/components/dashboard/AgentStatusBoard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertsCenter } from "@/components/dashboard/AlertsCenter";
import { PlatformSpendChart, PlatformComparisonChart } from "@/components/dashboard/PlatformChart";
import { SeedButton } from "@/components/dashboard/SeedButton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Seed button for demo */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Last updated: just now</p>
        </div>
        <SeedButton />
      </div>

      {/* Overview metrics */}
      <OverviewCards />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PlatformSpendChart />
        </div>
        <div>
          <PlatformComparisonChart />
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AgentStatusBoard />
        </div>
        <div className="space-y-4">
          <AlertsCenter />
        </div>
      </div>

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  );
}
