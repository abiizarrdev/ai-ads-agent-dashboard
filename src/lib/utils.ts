import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case "google_ads":
      return "#4285F4";
    case "meta_ads":
      return "#1877F2";
    case "tiktok_ads":
      return "#010101";
    default:
      return "#6B7280";
  }
}

export function getPlatformLabel(platform: string): string {
  switch (platform) {
    case "google_ads":
      return "Google Ads";
    case "meta_ads":
      return "Meta Ads";
    case "tiktok_ads":
      return "TikTok Ads";
    default:
      return platform;
  }
}

export function getAgentTypeLabel(type: string): string {
  switch (type) {
    case "monitor":
      return "Monitor";
    case "optimizer":
      return "Optimizer";
    case "content_generator":
      return "Content Generator";
    case "competitor":
      return "Competitor";
    default:
      return type;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-emerald-600";
    case "paused":
      return "text-amber-500";
    case "error":
      return "text-red-500";
    case "idle":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-600 bg-red-50 border-red-200";
    case "warning":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "info":
      return "text-blue-600 bg-blue-50 border-blue-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}
