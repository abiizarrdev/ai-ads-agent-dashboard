"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { PlatformBadge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Activity, Zap, AlertTriangle, TrendingUp, FileText, Settings } from "lucide-react";

interface ActivityItem {
  id: string;
  agentId: string | null;
  agentName: string | null;
  agentType: string | null;
  type: string;
  platform: string | null;
  title: string;
  description: string | null;
  createdAt: string;
}

const activityIcons: Record<string, { icon: typeof Activity; color: string }> = {
  action: { icon: Zap, color: "text-blue-500 bg-blue-50" },
  analysis: { icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" },
  alert: { icon: AlertTriangle, color: "text-amber-500 bg-amber-50" },
  optimization: { icon: Settings, color: "text-purple-500 bg-purple-50" },
  content: { icon: FileText, color: "text-indigo-500 bg-indigo-50" },
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => {
        setActivities(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchActivities();
    // Poll every 30 seconds for real-time feel
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Activity Feed</p>
            <p className="text-xs text-gray-400">Real-time agent actions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-3 animate-pulse flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))
          : activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
        {!loading && activities.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No activity yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: ActivityItem }) {
  const config = activityIcons[activity.type] || activityIcons.action;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-gray-900 leading-snug">{activity.title}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
            {timeAgo(activity.createdAt)}
          </span>
        </div>
        {activity.description && (
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {activity.agentName && (
            <span className="text-[10px] text-gray-400">{activity.agentName}</span>
          )}
          {activity.platform && (
            <PlatformBadge platform={activity.platform} />
          )}
        </div>
      </div>
    </div>
  );
}
