"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Downloads the final rendered video via the authenticated
 * GET /lectures/{id}/download endpoint (which sets Content-Disposition:
 * attachment). Uses a blob so the bearer token travels in the Authorization
 * header — never in the URL — and the browser saves a real file regardless of
 * how /static is proxied.
 */
export function DownloadButton({
  lectureId,
  className = "",
  label = "⬇ download",
}: {
  lectureId: string;
  className?: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleDownload = async () => {
    setState("loading");
    setMessage("");
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      const res = await fetch(`${API_BASE}/lectures/${lectureId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let detail = `Download failed (HTTP ${res.status})`;
        try {
          detail = (await res.json()).detail || detail;
        } catch {}
        throw new Error(detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lecture-${lectureId.slice(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch (e: any) {
      console.error("Video download failed:", e);
      setMessage(e?.message || "Download failed");
      setState("error");
      setTimeout(() => setState("idle"), 5000);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={state === "loading"}
      title={state === "error" ? message : undefined}
      className={className}
    >
      {state === "loading" ? "⟳ downloading..." : state === "error" ? "✘ not ready" : label}
    </button>
  );
}
