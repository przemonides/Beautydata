"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export function GenerateRecommendationButton({
  clientId,
}: {
  clientId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Wystąpił błąd");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas generowania rekomendacji");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleGenerate} disabled={loading} variant="default">
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Generuj rekomendację AI
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
