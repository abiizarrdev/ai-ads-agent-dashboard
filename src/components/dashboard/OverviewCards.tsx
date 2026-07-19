"use client";

import { StatCard } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatNumber, formatROAS } from "@/lib/utils";
import { DollarSign, TrendingUp, MousePointer, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface OverviewData {
  totalSpend: number;
  totalConversions: number;
  totalImpressions: number;
  totalClicks: number;
  avgRoas: number;
}

export function OverviewCards() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        setData(d.overview);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const spend = data?.totalSpend || 0;
  const roas = data?.avgRoas || 0;
  const conversions = data?.totalConversions || 0;
  const impressions = data?.totalImpressions || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Spend"
        value={formatCurrency(spend)}
        change="12.4%"
        changeType="up"
        subtitle="vs last period"
        icon={<DollarSign className="w-5 h-5" />}
      />
      <StatCard
        title="Avg. ROAS"
        value={formatROAS(roas)}
        change="0.3x"
        changeType="up"
        subtitle="vs last period"
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <StatCard
        title="Conversions"
        value={formatNumber(conversions)}
        change="8.1%"
        changeType="up"
        subtitle="vs last period"
        icon={<MousePointer className="w-5 h-5" />}
      />
      <StatCard
        title="Impressions"
        value={formatNumber(impressions)}
        change="3.2%"
        changeType="down"
        subtitle="vs last period"
        icon={<Users className="w-5 h-5" />}
      />
    </div>
  );
}
