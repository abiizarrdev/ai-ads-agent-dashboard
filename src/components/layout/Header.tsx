"use client";

import { usePathname } from "next/navigation";
import { Bell, RefreshCw } from "lucide-react";
import { useState } from "react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of all campaigns and agent activity" },
  "/dashboard/agents": { title: "AI Agents", subtitle: "Manage and monitor your autonomous agents" },
  "/dashboard/analytics": { title: "Analytics", subtitle: "Cross-platform performance trends and insights" },
  "/dashboard/alerts": { title: "Alerts Center", subtitle: "Platform notifications and agent warnings" },
  "/dashboard/settings": { title: "Settings", subtitle: "Platform connections and configuration" },
};

export function Header() {
  const pathname = usePathname();
  const [refreshing, setRefreshing] = useState(false);

  // Match agent detail pages
  const pageInfo = pageTitles[pathname] ||
    (pathname.startsWith("/dashboard/agents/") ? { title: "Agent Detail", subtitle: "View and manage agent configuration" } : null) ||
    { title: "AdAgent AI", subtitle: "Campaign Intelligence Platform" };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 500);
  };

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{pageInfo.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{pageInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-700 font-medium">Live</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">A</span>
        </div>
      </div>
    </header>
  );
}
