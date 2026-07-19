import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "purple" | "orange";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  orange: "bg-orange-50 text-orange-700",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

export function Badge({ children, variant = "default", className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles[variant])} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "success", label: "Active" },
    paused: { variant: "warning", label: "Paused" },
    error: { variant: "error", label: "Error" },
    idle: { variant: "default", label: "Idle" },
  };

  const { variant, label } = config[status] || { variant: "default", label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return <Badge variant="default">All Platforms</Badge>;
  
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    google_ads: { variant: "info", label: "Google Ads" },
    meta_ads: { variant: "purple", label: "Meta Ads" },
    tiktok_ads: { variant: "default", label: "TikTok Ads" },
  };

  const { variant, label } = config[platform] || { variant: "default", label: platform };
  return <Badge variant={variant}>{label}</Badge>;
}

export function AgentTypeBadge({ type }: { type: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    monitor: { variant: "info", label: "Monitor" },
    optimizer: { variant: "success", label: "Optimizer" },
    content_generator: { variant: "purple", label: "Content Gen" },
    competitor: { variant: "orange", label: "Competitor" },
  };

  const { variant, label } = config[type] || { variant: "default", label: type };
  return <Badge variant={variant}>{label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    critical: { variant: "error", label: "Critical" },
    warning: { variant: "warning", label: "Warning" },
    info: { variant: "info", label: "Info" },
  };

  const { variant, label } = config[severity] || { variant: "default", label: severity };
  return <Badge variant={variant} dot>{label}</Badge>;
}
