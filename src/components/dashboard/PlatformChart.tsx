"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { getPlatformColor, getPlatformLabel, formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface MetricData {
  platform: string;
  campaignName: string;
  spend: number;
  roas: number;
  conversions: number;
  date: string;
}

interface ChartData {
  date: string;
  google_ads: number;
  meta_ads: number;
  tiktok_ads: number;
}

interface PlatformChartProps {
  type?: "spend" | "roas" | "conversions";
}

export function PlatformSpendChart({ type = "spend" }: PlatformChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"spend" | "roas" | "conversions">(type);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        const metrics: MetricData[] = d.metrics || [];

        // Group by date and platform
        const byDate: Record<string, Record<string, number>> = {};

        metrics.forEach((m) => {
          const date = format(new Date(m.date), "MMM d");
          if (!byDate[date]) byDate[date] = {};
          const value =
            activeType === "spend"
              ? m.spend
              : activeType === "roas"
              ? m.roas
              : m.conversions;
          byDate[date][m.platform] = (byDate[date][m.platform] || 0) + value;
        });

        const sorted = Object.entries(byDate)
          .slice(-14)
          .map(([date, vals]) => ({
            date,
            google_ads: Math.round((vals.google_ads || 0) * 10) / 10,
            meta_ads: Math.round((vals.meta_ads || 0) * 10) / 10,
            tiktok_ads: Math.round((vals.tiktok_ads || 0) * 10) / 10,
          }));

        setChartData(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeType]);

  const tabs = [
    { key: "spend" as const, label: "Spend" },
    { key: "roas" as const, label: "ROAS" },
    { key: "conversions" as const, label: "Conversions" },
  ];

  const formatValue = (val: number) =>
    activeType === "spend"
      ? formatCurrency(val)
      : activeType === "roas"
      ? `${val.toFixed(1)}x`
      : val.toString();

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-gray-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Platform Performance</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeType === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="h-56 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                {["google_ads", "meta_ads", "tiktok_ads"].map((p) => (
                  <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getPlatformColor(p)} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={getPlatformColor(p)} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  activeType === "spend"
                    ? `$${(v / 1000).toFixed(0)}k`
                    : activeType === "roas"
                    ? `${v}x`
                    : String(v)
                }
                width={40}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 10,
                  border: "1px solid #f3f4f6",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
                formatter={(value, name) => [formatValue(Number(value)), getPlatformLabel(String(name))]}
              />
              {["google_ads", "meta_ads", "tiktok_ads"].map((p) => (
                <Area
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={getPlatformColor(p)}
                  strokeWidth={2}
                  fill={`url(#grad-${p})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {["google_ads", "meta_ads", "tiktok_ads"].map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: getPlatformColor(p) }}
              />
              <span className="text-xs text-gray-500">{getPlatformLabel(p)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface PlatformBarData {
  platform: string;
  spend: number;
  conversions: number;
  roas: number;
}

export function PlatformComparisonChart() {
  const [data, setData] = useState<PlatformBarData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        const byPlatform = d.byPlatform || [];
        setData(
          byPlatform.map((p: { platform: string; totalSpend: number; totalConversions: number; avgRoas: number }) => ({
            platform: getPlatformLabel(p.platform),
            spend: Math.round(p.totalSpend),
            conversions: p.totalConversions,
            roas: Math.round(p.avgRoas * 10) / 10,
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card padding="none">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-gray-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900">Platform Comparison</p>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barGap={4} barCategoryGap={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #f3f4f6" }}
                formatter={(value) => [formatCurrency(Number(value)), "Spend"]}
              />
              <Bar dataKey="spend" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
