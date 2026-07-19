"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { SeverityBadge, PlatformBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import { Bell, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AlertItem {
  id: string;
  agentId: string | null;
  agentName: string | null;
  platform: string | null;
  severity: string;
  title: string;
  description: string | null;
  resolved: boolean;
  createdAt: string;
}

export function AlertsCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => {
        setAlerts(Array.isArray(d) ? d.filter((a: AlertItem) => !a.resolved).slice(0, 5) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const resolveAlert = async (id: string) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: true }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Bell className="w-4 h-4 text-red-500" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {criticalCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Alerts Center</p>
            <p className="text-xs text-gray-400">{alerts.length} active alerts</p>
          </div>
        </div>
        <Link
          href="/dashboard/alerts"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-3 animate-pulse flex gap-3">
                <div className="w-2 bg-gray-100 rounded h-auto" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))
          : alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onResolve={resolveAlert} />
            ))}
        {!loading && alerts.length === 0 && (
          <div className="px-6 py-8 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">All clear!</p>
            <p className="text-xs text-gray-400 mt-0.5">No active alerts</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function AlertItem({
  alert,
  onResolve,
}: {
  alert: AlertItem;
  onResolve: (id: string) => void;
}) {
  const borderColor = {
    critical: "border-l-red-400",
    warning: "border-l-amber-400",
    info: "border-l-blue-400",
  }[alert.severity] || "border-l-gray-200";

  return (
    <div className={`flex gap-3 px-6 py-3.5 border-l-2 ${borderColor} hover:bg-gray-50/50 transition-colors`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            {alert.platform && <PlatformBadge platform={alert.platform} />}
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(alert.createdAt)}</span>
        </div>
        <p className="text-xs font-medium text-gray-900 mb-0.5">{alert.title}</p>
        {alert.description && (
          <p className="text-[11px] text-gray-500 line-clamp-2">{alert.description}</p>
        )}
        {alert.agentName && (
          <p className="text-[10px] text-gray-400 mt-1">Agent: {alert.agentName}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onResolve(alert.id)}
        icon={<Check className="w-3 h-3" />}
        className="flex-shrink-0 self-start mt-0.5"
      >
        Resolve
      </Button>
    </div>
  );
}
