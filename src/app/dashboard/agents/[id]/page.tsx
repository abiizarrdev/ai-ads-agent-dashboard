"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StatusBadge, AgentTypeBadge, PlatformBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { timeAgo, formatNumber, getAgentTypeLabel } from "@/lib/utils";
import type { Agent, ActivityLog } from "@/db/schema";
import {
  Bot,
  ArrowLeft,
  Pause,
  Play,
  Trash2,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  Activity,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface AgentDetail {
  agent: Agent;
  logs: ActivityLog[];
}

const activityIcons: Record<string, { icon: typeof Activity; color: string }> = {
  action: { icon: Zap, color: "text-blue-500 bg-blue-50" },
  analysis: { icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" },
  alert: { icon: AlertTriangle, color: "text-amber-500 bg-amber-50" },
  optimization: { icon: Settings, color: "text-purple-500 bg-purple-50" },
  content: { icon: FileText, color: "text-indigo-500 bg-indigo-50" },
};

const agentTypeCapabilities: Record<string, string[]> = {
  monitor: [
    "Real-time campaign performance monitoring",
    "Budget pacing alerts",
    "CTR and ROAS anomaly detection",
    "Scheduled health checks",
    "Alert escalation",
  ],
  optimizer: [
    "Automated bid adjustments",
    "Budget reallocation",
    "Audience targeting optimization",
    "A/B test analysis",
    "ROAS target optimization",
  ],
  content_generator: [
    "AI-powered ad copy generation",
    "Creative brief creation",
    "Multi-platform format adaptation",
    "Tone and style customization",
    "Performance-based copy iteration",
  ],
  competitor: [
    "Competitor ad library scanning",
    "Keyword gap analysis",
    "Bid landscape tracking",
    "Market share estimation",
    "Trend identification",
  ],
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`/api/agents/${id}`);
    if (res.ok) {
      const data = await res.json();
      setDetail(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  const togglePause = async () => {
    if (!detail) return;
    const newStatus = detail.agent.status === "active" ? "paused" : "active";
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchDetail();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    router.push("/dashboard/agents");
  };

  const generateRecommendations = async () => {
    if (!detail) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "optimization",
          agentId: id,
          platform: detail.agent.platform || "google_ads",
          metrics: { roas: 4.2, ctr: 0.045, conversions: 120, spend: 5200 },
        }),
      });
      const data = await res.json();
      setGeneratedContent(data.recommendations || []);
      await fetchDetail();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!detail) return (
    <div className="text-center py-20">
      <Bot className="w-12 h-12 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500">Agent not found</p>
      <Button className="mt-4" variant="outline" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  const { agent, logs } = detail;
  const capabilities = agentTypeCapabilities[agent.type] || [];
  const successRateColor = agent.successRate >= 0.9 ? "text-emerald-600" : agent.successRate >= 0.75 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
      </div>

      {/* Agent Profile */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-semibold text-gray-900">{agent.name}</h1>
                <StatusBadge status={agent.status} />
              </div>
              <p className="text-sm text-gray-500 mb-3 max-w-lg">{agent.description}</p>
              <div className="flex items-center gap-2">
                <AgentTypeBadge type={agent.type} />
                <PlatformBadge platform={agent.platform} />
                <Badge variant="default">
                  Created {timeAgo(agent.createdAt)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateRecommendations}
              loading={generating}
              icon={<Zap className="w-3.5 h-3.5" />}
            >
              AI Optimize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDetail}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePause}
              icon={agent.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {agent.status === "active" ? "Pause" : "Activate"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(agent.tasksCompleted)}</p>
          <p className="text-xs text-gray-400 mt-1">Tasks Completed</p>
        </Card>
        <Card className="text-center">
          <p className={`text-2xl font-semibold ${successRateColor}`}>
            {(agent.successRate * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Success Rate</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-gray-900">
            {agent.lastHeartbeat ? timeAgo(agent.lastHeartbeat) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Last Heartbeat</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold text-gray-900">
            {getAgentTypeLabel(agent.type)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Agent Type</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capabilities */}
        <Card>
          <p className="text-sm font-semibold text-gray-900 mb-4">Capabilities</p>
          <ul className="space-y-2.5">
            {capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600">{cap}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Config */}
        <Card>
          <p className="text-sm font-semibold text-gray-900 mb-4">Configuration</p>
          {agent.config && Object.keys(agent.config as object).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(agent.config as Record<string, unknown>).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-xs font-medium text-gray-900 max-w-[120px] truncate">
                    {Array.isArray(val) ? val.join(", ") : String(val)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No configuration set</p>
          )}
        </Card>

        {/* AI Recommendations */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">AI Recommendations</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateRecommendations}
              loading={generating}
              icon={<Zap className="w-3 h-3" />}
            >
              Generate
            </Button>
          </div>
          {generatedContent.length > 0 ? (
            <ul className="space-y-2">
              {generatedContent.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[11px] text-gray-700">{rec}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <Zap className="w-6 h-6 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Click Generate to get AI recommendations</p>
            </div>
          )}
        </Card>
      </div>

      {/* Activity Log */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
          <Activity className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-gray-900">Activity Log</p>
          <span className="text-xs text-gray-400">({logs.length} events)</span>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No activity recorded yet</p>
            </div>
          ) : (
            logs.map((log) => {
              const config = activityIcons[log.type] || activityIcons.action;
              const Icon = config.icon;
              return (
                <div key={log.id} className="flex gap-3 px-6 py-3.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-gray-900">{log.title}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{log.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
