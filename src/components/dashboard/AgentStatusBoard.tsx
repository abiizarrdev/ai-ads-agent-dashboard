"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge, AgentTypeBadge, PlatformBadge } from "@/components/ui/Badge";
import { SkeletonRow } from "@/components/ui/LoadingSpinner";
import { timeAgo, formatNumber } from "@/lib/utils";
import type { Agent } from "@/db/schema";
import { Bot, ArrowRight } from "lucide-react";

export function AgentStatusBoard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        setAgents(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const errorCount = agents.filter((a) => a.status === "error").length;

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Agent Status Board</p>
            <p className="text-xs text-gray-400">
              {activeCount} active · {errorCount} errors
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/agents"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-3">
                <SkeletonRow />
              </div>
            ))
          : agents.slice(0, 6).map((agent) => (
              <AgentRow key={agent.id} agent={agent} />
            ))}
        {!loading && agents.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Bot className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No agents created yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const successRateColor =
    agent.successRate >= 0.9
      ? "text-emerald-600"
      : agent.successRate >= 0.75
      ? "text-amber-600"
      : "text-red-600";

  return (
    <Link href={`/dashboard/agents/${agent.id}`} className="block">
      <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-colors group">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
          <Bot className="w-4 h-4 text-gray-500" />
        </div>

        {/* Name and meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <AgentTypeBadge type={agent.type} />
            <PlatformBadge platform={agent.platform} />
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-gray-400">Tasks</p>
            <p className="text-sm font-medium text-gray-900">{formatNumber(agent.tasksCompleted)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Success</p>
            <p className={`text-sm font-medium ${successRateColor}`}>
              {(agent.successRate * 100).toFixed(0)}%
            </p>
          </div>
          <div className="text-right hidden lg:block">
            <p className="text-xs text-gray-400">Last seen</p>
            <p className="text-sm text-gray-600">
              {agent.lastHeartbeat ? timeAgo(agent.lastHeartbeat) : "Never"}
            </p>
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={agent.status} />
      </div>
    </Link>
  );
}
