"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Database } from "lucide-react";

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.message) {
        setDone(true);
        setTimeout(() => window.location.reload(), 500);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeed}
      loading={loading}
      icon={<Database className="w-3.5 h-3.5" />}
    >
      Load Demo Data
    </Button>
  );
}
