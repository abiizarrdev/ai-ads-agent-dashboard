"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  Bell,
  Settings,
  Zap,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/dashboard/agents", icon: Bot },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AdAgent AI</p>
            <p className="text-[10px] text-gray-400 leading-none">Campaign Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                isActive
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Platform status */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Connected Platforms</p>
        <div className="space-y-2">
          <PlatformStatus platform="Google Ads" color="bg-blue-500" connected />
          <PlatformStatus platform="Meta Ads" color="bg-indigo-500" connected />
          <PlatformStatus platform="TikTok Ads" color="bg-gray-300" connected={false} />
        </div>
      </div>
    </aside>
  );
}

function PlatformStatus({
  platform,
  color,
  connected,
}: {
  platform: string;
  color: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("w-2 h-2 rounded-full", connected ? color : "bg-gray-200")} />
      <span className="text-xs text-gray-500">{platform}</span>
      {connected ? (
        <span className="ml-auto text-[10px] text-emerald-600 font-medium">On</span>
      ) : (
        <span className="ml-auto text-[10px] text-gray-400">Off</span>
      )}
    </div>
  );
}
