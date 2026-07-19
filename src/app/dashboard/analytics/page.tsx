"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlatformBadge, Badge } from "@/components/ui/Badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format } from "date-fns";
import { getPlatformColor, getPlatformLabel, formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, Zap, RefreshCw, Brain, ChevronRight, X } from "lucide-react";

interface MetricRow {
  platform: string;
  campaignName: string;
  spend: number;
  roas: number;
  conversions: number;
  clicks: number;
  impressions: number;
  date: string;
}

interface PlatformSummary {
  platform: string;
  totalSpend: number;
  totalConversions: number;
  totalImpressions: number;
  avgRoas: number;
}

interface Insight {
  id: string;
  platform: string | null;
  title: string;
  content: string;
  category: string | null;
  confidence: number;
  actionable: boolean;
}

interface DailyData {
  date: string;
  google_ads: number;
  meta_ads: number;
  tiktok_ads: number;
  total: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [byPlatform, setByPlatform] = useState<PlatformSummary[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState<"spend" | "roas" | "conversions">("spend");

  useEffect(() => {
    Promise.all([
      fetch("/api/metrics").then((r) => r.json()),
      fetch("/api/insights").then((r) => r.json()),
    ]).then(([metricsData, insightsData]) => {
      setMetrics(metricsData.metrics || []);
      setByPlatform(metricsData.byPlatform || []);
      setInsights(Array.isArray(insightsData) ? insightsData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const regenerateInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const newInsights = await res.json();
      if (Array.isArray(newInsights)) {
        setInsights((prev) => [...newInsights, ...prev].slice(0, 6));
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  const dismissInsight = async (id: string) => {
    await fetch("/api/insights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  // Build daily time-series data
  const dailyData: DailyData[] = (() => {
    const byDate: Record<string, Record<string, number>> = {};
    metrics.forEach((m) => {
      const date = format(new Date(m.date), "MMM d");
      if (!byDate[date]) byDate[date] = {};
      const val = activeMetric === "spend" ? m.spend : activeMetric === "roas" ? m.roas : m.conversions;
      byDate[date][m.platform] = (byDate[date][m.platform] || 0) + val;
    });
    return Object.entries(byDate).slice(-14).map(([date, vals]) => ({
      date,
      google_ads: Math.round((vals.google_ads || 0) * 10) / 10,
      meta_ads: Math.round((vals.meta_ads || 0) * 10) / 10,
      tiktok_ads: Math.round((vals.tiktok_ads || 0) * 10) / 10,
      total: Math.round(((vals.google_ads || 0) + (vals.meta_ads || 0) + (vals.tiktok_ads || 0)) * 10) / 10,
    }));
  })();

  // Pie chart data
  const pieData = byPlatform.map((p) => ({
    name: getPlatformLabel(p.platform),
    value: Math.round(p.totalSpend),
    color: getPlatformColor(p.platform),
  }));

  // ROAS comparison bar data
  const roasData = byPlatform.map((p) => ({
    platform: getPlatformLabel(p.platform),
    roas: Math.round(p.avgRoas * 10) / 10,
    color: getPlatformColor(p.platform),
  }));

  const totalSpend = byPlatform.reduce((s, p) => s + p.totalSpend, 0);
  const totalConversions = byPlatform.reduce((s, p) => s + p.totalConversions, 0);

  const formatAxisValue = (v: number) =>
    activeMetric === "spend" ? `$${(v / 1000).toFixed(0)}k` : activeMetric === "roas" ? `${v}x` : String(v);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-gray-400 mb-1">Total Spend</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalSpend)}</p>
          <p className="text-xs text-emerald-600 mt-1">↑ 12.4% vs last period</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Total Conversions</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(totalConversions)}</p>
          <p className="text-xs text-emerald-600 mt-1">↑ 8.1% vs last period</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Best ROAS Platform</p>
          <p className="text-2xl font-semibold text-gray-900">
            {byPlatform.sort((a, b) => b.avgRoas - a.avgRoas)[0]
              ? `${byPlatform.sort((a, b) => b.avgRoas - a.avgRoas)[0].avgRoas.toFixed(1)}x`
              : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {byPlatform.sort((a, b) => b.avgRoas - a.avgRoas)[0]
              ? getPlatformLabel(byPlatform.sort((a, b) => b.avgRoas - a.avgRoas)[0].platform)
              : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Avg. CPL</p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalConversions > 0 ? formatCurrency(totalSpend / totalConversions) : "—"}
          </p>
          <p className="text-xs text-red-500 mt-1">↓ 3.2% vs last period</p>
        </Card>
      </div>

      {/* Main trend chart */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-900">Performance Trends</p>
            <span className="text-xs text-gray-400">Last 14 days</span>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(["spend", "roas", "conversions"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                  activeMetric === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={formatAxisValue} width={45} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #f3f4f6", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  formatter={(v, n) => [
                    activeMetric === "spend" ? formatCurrency(Number(v)) : activeMetric === "roas" ? `${Number(v).toFixed(1)}x` : String(v),
                    getPlatformLabel(String(n))
                  ]}
                />
                {["google_ads", "meta_ads", "tiktok_ads"].map((p) => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={p}
                    stroke={getPlatformColor(p)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-3">
            {["google_ads", "meta_ads", "tiktok_ads"].map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: getPlatformColor(p) }} />
                <span className="text-xs text-gray-500">{getPlatformLabel(p)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spend distribution pie */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">Spend Distribution</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Spend"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {pieData.map((d) => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-xs text-gray-600">{d.name}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">{formatCurrency(d.value)}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${totalSpend > 0 ? (d.value / totalSpend) * 100 : 0}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ROAS comparison */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">ROAS by Platform</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={roasData} barCategoryGap={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} domain={[0, "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${Number(v).toFixed(1)}x`, "ROAS"]} />
                  <Bar dataKey="roas" radius={[6, 6, 0, 0]}>
                    {roasData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">AI-Generated Insights</p>
              <p className="text-xs text-gray-400">Powered by Cerebras llama-3.3-70b</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateInsights}
            loading={insightsLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                <div className="h-2 bg-gray-100 rounded w-4/5" />
              </div>
            ))
          ) : insights.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <Brain className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No insights yet</p>
              <Button size="sm" onClick={regenerateInsights} icon={<Zap className="w-3.5 h-3.5" />}>
                Generate Insights
              </Button>
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="relative p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {insight.category && (
                        <Badge variant="info">{insight.category}</Badge>
                      )}
                      {insight.platform && <PlatformBadge platform={insight.platform} />}
                      {insight.actionable && (
                        <Badge variant="success">Actionable</Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{insight.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-20 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700">
                    View details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Campaign breakdown table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-900">Campaign Performance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Spend</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ROAS</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Impressions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                (() => {
                  // Aggregate by campaign
                  const byCampaign: Record<string, { name: string; platform: string; spend: number; roas: number; conversions: number; impressions: number; count: number }> = {};
                  metrics.forEach((m) => {
                    const key = `${m.platform}-${m.campaignName}`;
                    if (!byCampaign[key]) {
                      byCampaign[key] = { name: m.campaignName, platform: m.platform, spend: 0, roas: 0, conversions: 0, impressions: 0, count: 0 };
                    }
                    byCampaign[key].spend += m.spend;
                    byCampaign[key].roas += m.roas;
                    byCampaign[key].conversions += m.conversions;
                    byCampaign[key].impressions += m.impressions;
                    byCampaign[key].count++;
                  });
                  return Object.values(byCampaign).map((c) => (
                    <tr key={`${c.platform}-${c.name}`} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-3"><PlatformBadge platform={c.platform} /></td>
                      <td className="px-6 py-3 text-sm text-gray-900 text-right">{formatCurrency(c.spend)}</td>
                      <td className="px-6 py-3 text-sm text-right">
                        <span className={c.roas / c.count >= 3 ? "text-emerald-600 font-medium" : "text-amber-600"}>
                          {(c.roas / c.count).toFixed(1)}x
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 text-right">{formatNumber(c.conversions)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700 text-right">{formatNumber(c.impressions)}</td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
