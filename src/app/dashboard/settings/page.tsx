"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { timeAgo } from "@/lib/utils";
import type { PlatformConnection } from "@/db/schema";
import {
  Settings,
  Link as LinkIcon,
  Unlink,
  CheckCircle,
  AlertCircle,
  Zap,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Brain,
} from "lucide-react";

interface ConnectForm {
  platform: "google_ads" | "meta_ads" | "tiktok_ads";
  accountName: string;
  accountId: string;
}

const platformConfig = {
  google_ads: {
    name: "Google Ads",
    icon: "G",
    iconBg: "bg-blue-500",
    description: "Connect your Google Ads account to enable campaign monitoring and optimization.",
    features: ["Campaign monitoring", "Bid optimization", "Budget management", "Keyword analysis"],
    composioApp: "google-ads",
  },
  meta_ads: {
    name: "Meta Ads",
    icon: "M",
    iconBg: "bg-indigo-600",
    description: "Connect Meta Business Manager to manage Facebook and Instagram campaigns.",
    features: ["Campaign management", "Audience insights", "Creative performance", "Budget pacing"],
    composioApp: "meta-ads",
  },
  tiktok_ads: {
    name: "TikTok Ads",
    icon: "T",
    iconBg: "bg-gray-900",
    description: "Connect TikTok Ads Manager to reach Gen Z and millennial audiences.",
    features: ["Video campaign tracking", "Audience targeting", "Performance analytics", "Creative tools"],
    composioApp: "tiktok-ads",
  },
};

export default function SettingsPage() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectPlatform, setConnectPlatform] = useState<keyof typeof platformConfig | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<keyof typeof platformConfig | null>(null);
  const [connectForm, setConnectForm] = useState<ConnectForm>({ platform: "google_ads", accountName: "", accountId: "" });
  const [connecting, setConnecting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [adCopyPlatform, setAdCopyPlatform] = useState("google_ads");
  const [adCopyProduct, setAdCopyProduct] = useState("");
  const [adCopyAudience, setAdCopyAudience] = useState("");
  const [adCopyTone, setAdCopyTone] = useState("professional");
  const [generatedCopies, setGeneratedCopies] = useState<{ headline: string; description: string; cta: string }[]>([]);
  const [generatingCopy, setGeneratingCopy] = useState(false);

  const fetchConnections = useCallback(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((d) => {
        setConnections(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getConnection = (platform: string) =>
    connections.find((c) => c.platform === platform);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Simulate Composio OAuth flow (in production, redirect to Composio OAuth)
      const composioConnectionId = `comp_${connectForm.platform}_${Date.now()}`;
      await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: connectForm.platform,
          accountName: connectForm.accountName || `${platformConfig[connectForm.platform].name} Account`,
          accountId: connectForm.accountId || `acc_${Date.now()}`,
          composioConnectionId,
          scopes: ["read", "write"],
        }),
      });
      setConnectPlatform(null);
      setConnectForm({ platform: "google_ads", accountName: "", accountId: "" });
      fetchConnections();
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectPlatform) return;
    await fetch(`/api/connections?platform=${disconnectPlatform}`, { method: "DELETE" });
    setDisconnectPlatform(null);
    fetchConnections();
  };

  const openConnect = (platform: keyof typeof platformConfig) => {
    setConnectPlatform(platform);
    setConnectForm({ platform, accountName: "", accountId: "" });
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText("demo_cerebras_key_xxxx").catch(() => {});
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const generateAdCopy = async () => {
    if (!adCopyProduct) return;
    setGeneratingCopy(true);
    setGeneratedCopies([]);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ad_copy",
          platform: adCopyPlatform,
          product: adCopyProduct,
          audience: adCopyAudience || "General audience",
          tone: adCopyTone,
        }),
      });
      const data = await res.json();
      setGeneratedCopies(data.copies || []);
    } finally {
      setGeneratingCopy(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Platform Connections */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <LinkIcon className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Platform Connections</p>
            <p className="text-xs text-gray-400">Connect ad platforms via Composio OAuth</p>
          </div>
        </div>

        <div className="space-y-3">
          {(Object.entries(platformConfig) as [keyof typeof platformConfig, typeof platformConfig[keyof typeof platformConfig]][]).map(([platform, config]) => {
            const conn = getConnection(platform);
            const isConnected = conn?.connected ?? false;

            return (
              <Card key={platform}>
                <div className="flex items-start gap-4">
                  {/* Platform icon */}
                  <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-base">{config.icon}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{config.name}</p>
                      {isConnected ? (
                        <Badge variant="success" dot>Connected</Badge>
                      ) : (
                        <Badge variant="default">Not connected</Badge>
                      )}
                    </div>

                    {isConnected && conn ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Account:</span> {conn.accountName}
                        </p>
                        <p className="text-xs text-gray-400">
                          <span className="font-medium">ID:</span> {conn.accountId}
                        </p>
                        {conn.lastSyncAt && (
                          <p className="text-xs text-gray-400">
                            Last sync: {timeAgo(conn.lastSyncAt)}
                          </p>
                        )}
                        {conn.composioConnectionId && (
                          <p className="text-xs text-gray-400">
                            Composio: <code className="font-mono text-[10px] bg-gray-100 px-1 rounded">{conn.composioConnectionId}</code>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mb-2">{config.description}</p>
                    )}

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {config.features.map((f) => (
                        <span
                          key={f}
                          className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full"
                        >
                          {isConnected ? (
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5 text-gray-300" />
                          )}
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isConnected ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={() => {}} 
                        >
                          Sync
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Unlink className="w-3.5 h-3.5" />}
                          onClick={() => setDisconnectPlatform(platform)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<LinkIcon className="w-3.5 h-3.5" />}
                        onClick={() => openConnect(platform)}
                      >
                        Connect via Composio
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* API Configuration */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Settings className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">API Configuration</p>
            <p className="text-xs text-gray-400">Manage API keys and service connections</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Cerebras API */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Cerebras AI</p>
                  <p className="text-xs text-gray-400">llama-3.3-70b · Content generation & insights</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <code className="text-xs text-gray-600 font-mono">sk-***...***key</code>
                  <button onClick={copyApiKey} className="text-gray-400 hover:text-gray-700">
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Badge variant="success" dot>Connected</Badge>
              </div>
            </div>
          </Card>

          {/* Composio */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Composio SDK</p>
                  <p className="text-xs text-gray-400">MCP integration · Ads platform connector</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://composio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                >
                  Manage <ExternalLink className="w-3 h-3" />
                </a>
                <Badge variant="success" dot>Active</Badge>
              </div>
            </div>
          </Card>

          {/* Vercel Cron */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Agent Heartbeat</p>
                  <p className="text-xs text-gray-400">Vercel Cron · Every 6 hours · <code className="font-mono">0 */6 * * *</code></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Last run: 2h ago</span>
                <Badge variant="success" dot>Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Connect Modal */}
      <Modal
        open={!!connectPlatform}
        onClose={() => setConnectPlatform(null)}
        title={`Connect ${connectPlatform ? platformConfig[connectPlatform].name : ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Zap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              In production, clicking Connect will redirect you to Composio OAuth flow to securely authorize access to your ad account. Enter your account details below to simulate the connection.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Account Name</label>
            <input
              type="text"
              value={connectForm.accountName}
              onChange={(e) => setConnectForm({ ...connectForm, accountName: e.target.value })}
              placeholder="e.g. My Company - Google Ads"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Account ID</label>
            <input
              type="text"
              value={connectForm.accountId}
              onChange={(e) => setConnectForm({ ...connectForm, accountId: e.target.value })}
              placeholder="e.g. 123-456-7890"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConnectPlatform(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConnect}
              loading={connecting}
              icon={<LinkIcon className="w-4 h-4" />}
            >
              Connect via Composio
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disconnect Modal */}
      <Modal
        open={!!disconnectPlatform}
        onClose={() => setDisconnectPlatform(null)}
        title="Disconnect Platform"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to disconnect{" "}
            <strong>{disconnectPlatform ? platformConfig[disconnectPlatform].name : ""}</strong>? 
            All agents using this platform will be paused.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDisconnectPlatform(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
