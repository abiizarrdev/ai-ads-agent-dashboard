"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge, AgentTypeBadge, PlatformBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { timeAgo, formatNumber } from "@/lib/utils";
import type { Agent } from "@/db/schema";
import {
  Bot,
  Plus,
  Pause,
  Play,
  Trash2,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";

type AgentType = "monitor" | "optimizer" | "content_generator" | "competitor";
type Platform = "google_ads" | "meta_ads" | "tiktok_ads";
type AgentStatus = "active" | "paused" | "error" | "idle";

interface CreateAgentForm {
  name: string;
  type: AgentType;
  platform: Platform | "";
  description: string;
}

const agentTypeDescriptions: Record<AgentType, string> = {
  monitor: "Watches campaigns for anomalies, budget issues, and performance changes",
  optimizer: "Automatically adjusts bids, budgets, and targeting for better ROAS",
  content_generator: "Creates AI-powered ad copy and creative briefs",
  competitor: "Tracks competitor strategies and identifies market opportunities",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateAgentForm>({
    name: "",
    type: "monitor",
    platform: "",
    description: "",
  });

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAgents();
  }, [fetchAgents]);

  const handleCreate = async () => {
    if (!form.name || !form.type) return;
    setCreating(true);
    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          platform: form.platform || null,
          description: form.description || agentTypeDescriptions[form.type],
        }),
      });
      setCreateOpen(false);
      setForm({ name: "", type: "monitor", platform: "", description: "" });
      await fetchAgents();
    } finally {
      setCreating(false);
    }
  };

  const togglePause = async (agent: Agent) => {
    const newStatus: AgentStatus = agent.status === "active" ? "paused" : "active";
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchAgents();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/agents/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await fetchAgents();
  };

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || a.type === filterType;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    paused: agents.filter((a) => a.status === "paused").length,
    errors: agents.filter((a) => a.status === "error").length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: stats.total, color: "text-gray-900" },
          { label: "Active", value: stats.active, color: "text-emerald-600" },
          { label: "Paused", value: stats.paused, color: "text-amber-600" },
          { label: "Errors", value: stats.errors, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none bg-white text-gray-700"
          >
            <option value="all">All Types</option>
            <option value="monitor">Monitor</option>
            <option value="optimizer">Optimizer</option>
            <option value="content_generator">Content Generator</option>
            <option value="competitor">Competitor</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none bg-white text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="idle">Idle</option>
            <option value="error">Error</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="ml-auto"
        >
          New Agent
        </Button>
      </div>

      {/* Agents Grid */}
      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Bot className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-medium text-gray-700">No agents found</p>
          <p className="text-sm text-gray-400 mt-1">
            {agents.length === 0
              ? "Create your first agent to get started"
              : "Try adjusting your filters"}
          </p>
          {agents.length === 0 && (
            <Button
              className="mt-4"
              onClick={() => setCreateOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Agent
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onTogglePause={togglePause}
              onDelete={() => setDeleteTarget(agent)}
            />
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Agent" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Agent Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Google Performance Monitor"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Agent Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["monitor", "optimizer", "content_generator", "competitor"] as AgentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, type })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.type === type
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="text-xs font-medium capitalize">{type.replace("_", " ")}</p>
                  <p className={`text-[10px] mt-0.5 ${form.type === type ? "text-gray-300" : "text-gray-400"}`}>
                    {agentTypeDescriptions[type].slice(0, 50)}...
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Platform (Optional)</label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as Platform | "" })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white text-gray-700"
            >
              <option value="">All Platforms</option>
              <option value="google_ads">Google Ads</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="tiktok_ads">TikTok Ads</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what this agent does..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              loading={creating}
              disabled={!form.name}
            >
              Create Agent
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Agent" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              Delete Agent
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AgentCard({
  agent,
  onTogglePause,
  onDelete,
}: {
  agent: Agent;
  onTogglePause: (a: Agent) => void;
  onDelete: () => void;
}) {
  const successColor =
    agent.successRate >= 0.9 ? "text-emerald-600" : agent.successRate >= 0.75 ? "text-amber-600" : "text-red-600";
  const successBg =
    agent.successRate >= 0.9 ? "bg-emerald-500" : agent.successRate >= 0.75 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card hover className="relative group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
            <Bot className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{agent.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AgentTypeBadge type={agent.type} />
            </div>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
        {agent.description || "No description provided."}
      </p>

      {/* Platform */}
      <div className="mb-4">
        <PlatformBadge platform={agent.platform} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-sm font-semibold text-gray-900">{formatNumber(agent.tasksCompleted)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Tasks</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className={`text-sm font-semibold ${successColor}`}>
            {(agent.successRate * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Success</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-xs font-medium text-gray-600">
            {agent.lastHeartbeat ? timeAgo(agent.lastHeartbeat) : "Never"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Last seen</p>
        </div>
      </div>

      {/* Success rate bar */}
      <div className="mb-4">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${successBg}`}
            style={{ width: `${agent.successRate * 100}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTogglePause(agent)}
          icon={agent.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          {agent.status === "active" ? "Pause" : "Activate"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
          className="text-red-400 hover:text-red-600 hover:bg-red-50"
        />
        <Link href={`/dashboard/agents/${agent.id}`}>
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View
          </Button>
        </Link>
      </div>
    </Card>
  );
}
