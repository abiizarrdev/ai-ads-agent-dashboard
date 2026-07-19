"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { SeverityBadge, PlatformBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { timeAgo } from "@/lib/utils";
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle } from "lucide-react";

interface AlertItem {
  id: string;
  agentId: string | null;
  agentName: string | null;
  platform: string | null;
  severity: string;
  title: string;
  description: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchAlerts = useCallback(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => {
        setAlerts(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const resolveAlert = async (id: string) => {
    setResolving(id);
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: true }),
      });
      fetchAlerts();
    } finally {
      setResolving(null);
    }
  };

  const resolveAll = async () => {
    const activeAlerts = alerts.filter((a) => !a.resolved);
    await Promise.all(
      activeAlerts.map((a) =>
        fetch("/api/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: a.id, resolved: true }),
        })
      )
    );
    fetchAlerts();
  };

  const filtered = alerts.filter((a) => {
    if (filter === "active") return !a.resolved;
    if (filter === "resolved") return a.resolved;
    return true;
  });

  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => !a.resolved).length,
    critical: alerts.filter((a) => !a.resolved && a.severity === "critical").length,
    resolved: alerts.filter((a) => a.resolved).length,
  };

  const severityIcon = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-1">Total Alerts</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-amber-600">{stats.active}</p>
          <p className="text-xs text-gray-400 mt-1">Active</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-red-600">{stats.critical}</p>
          <p className="text-xs text-gray-400 mt-1">Critical</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-emerald-600">{stats.resolved}</p>
          <p className="text-xs text-gray-400 mt-1">Resolved</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(["all", "active", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          {stats.active > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resolveAll}
              icon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              Resolve All Active
            </Button>
          )}
        </div>
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-base font-medium text-gray-700">
            {filter === "resolved" ? "No resolved alerts" : "All clear! No active alerts"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "active" && "Your platforms are running smoothly"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const SevIcon = severityIcon[alert.severity as keyof typeof severityIcon] || Info;
            const iconColor = {
              critical: "text-red-500 bg-red-50",
              warning: "text-amber-500 bg-amber-50",
              info: "text-blue-500 bg-blue-50",
            }[alert.severity] || "text-gray-500 bg-gray-50";

            const borderColor = {
              critical: "border-l-red-400",
              warning: "border-l-amber-400",
              info: "border-l-blue-400",
            }[alert.severity] || "border-l-gray-200";

            return (
              <div
                key={alert.id}
                className={`bg-white border border-gray-100 border-l-2 ${borderColor} rounded-2xl p-5 shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <SevIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={alert.severity} />
                          {alert.platform && <PlatformBadge platform={alert.platform} />}
                          {alert.resolved && (
                            <Badge variant="success" dot>Resolved</Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                        {alert.description && (
                          <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {alert.agentName && (
                            <p className="text-xs text-gray-400">
                              <span className="font-medium">Agent:</span> {alert.agentName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">{timeAgo(alert.createdAt)}</p>
                          {alert.resolved && alert.resolvedAt && (
                            <p className="text-xs text-emerald-600">
                              Resolved {timeAgo(alert.resolvedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                          loading={resolving === alert.id}
                          icon={<Check className="w-3.5 h-3.5" />}
                          className="flex-shrink-0"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
