"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({ className, children, padding = "md", hover = false }: CardProps) {
  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm",
        paddingClass,
        hover && "hover:shadow-md transition-shadow duration-200 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, change, changeType, icon, subtitle, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {change && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              changeType === "up" && "text-emerald-700 bg-emerald-50",
              changeType === "down" && "text-red-600 bg-red-50",
              changeType === "neutral" && "text-gray-600 bg-gray-100"
            )}
          >
            {changeType === "up" && "↑ "}
            {changeType === "down" && "↓ "}
            {change}
          </span>
        )}
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
    </Card>
  );
}
