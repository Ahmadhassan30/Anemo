"use client";

import { useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/store/pipeline.store";
import { subscribeToPipeline } from "@/lib/sse-client";
import { Terminal, AnimatedSpan } from "@/components/magicui/terminal";
import { DownloadButton } from "@/components/professor/DownloadButton";

const AGENT_ORDER = [
  "ingest_agent",
  "transcription_agent",
  "segmentation_agent",
  "codegen_agent",
  "composition_agent",
  "rag_indexing_agent",
  "publish_agent",
];

const AGENT_LABELS: Record<string, string> = {
  ingest_agent: "Ingest & extract audio",
  transcription_agent: "Transcribe (Whisper)",
  segmentation_agent: "Extract concepts",
  codegen_agent: "Generate & render (Manim)",
  composition_agent: "Compose final video",
  rag_indexing_agent: "Index transcript (BGE)",
  publish_agent: "Publish to YouTube",
};

type StepStatus = "pending" | "running" | "retrying" | "done" | "failed";

interface PipelineMonitorProps {
  lectureId: string;
}

export function PipelineMonitor({ lectureId }: PipelineMonitorProps) {
  const { status, currentAgent, progress, events, youtubeUrl, startMonitoring, updateFromEvent } =
    usePipelineStore();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Live SSE subscription (unchanged wiring) ──────────────────────────────
  useEffect(() => {
    startMonitoring(lectureId);
    const cleanupPromise = subscribeToPipeline(lectureId, {
      onAgentStarted: updateFromEvent,
      onAgentCompleted: updateFromEvent,
      onAgentFailed: updateFromEvent,
      onPipelineCompleted: updateFromEvent,
      onPipelineFailed: updateFromEvent,
      onProgressUpdate: updateFromEvent,
    }).catch((err) => {
      setError(err.message);
      return () => {};
    });
    return () => {
      cleanupPromise.then((cleanup) => cleanup());
    };
  }, [lectureId, startMonitoring, updateFromEvent]);

  // Auto-scroll the terminal to the newest line
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getAgentStatus = (agentKey: string): StepStatus => {
    if (status === "failed" && currentAgent === agentKey) return "failed";
    const agentEvents = events.filter((e) => e.agent_name === agentKey);
    if (agentEvents.some((e) => e.event_type === "AGENT_FAILED")) return "failed";
    if (agentEvents.some((e) => e.event_type === "AGENT_COMPLETED")) return "done";
    if (agentEvents.some((e) => e.event_type === "AGENT_RETRYING")) return "retrying";
    if (agentEvents.some((e) => e.event_type === "AGENT_STARTED") || currentAgent === agentKey)
      return "running";
    const thisIdx = AGENT_ORDER.indexOf(agentKey);
    const curIdx = currentAgent ? AGENT_ORDER.indexOf(currentAgent) : -1;
    if (curIdx > thisIdx) return "done";
    return "pending";
  };

  const statusTone: Record<string, string> = {
    idle: "bg-fill text-subtle",
    running: "bg-accent/10 text-accent",
    completed: "bg-positive/10 text-positive",
    failed: "bg-danger/10 text-danger",
  };

  // ── Per-event terminal line styling ───────────────────────────────────────
  const lineFor = (eventType: string, message: string) => {
    const lower = `${eventType} ${message}`.toLowerCase();
    if (eventType === "AGENT_FAILED" || eventType === "PIPELINE_FAILED" || lower.includes("error") || lower.includes("failed"))
      return { color: "text-term-red", icon: "✘" };
    if (eventType === "AGENT_COMPLETED" || eventType === "PIPELINE_COMPLETED" || lower.includes("completed") || lower.includes("success"))
      return { color: "text-term-green", icon: "✔" };
    if (eventType === "AGENT_RETRYING") return { color: "text-term-amber", icon: "⟳" };
    if (eventType === "AGENT_STARTED" || lower.includes("starting")) return { color: "text-term-blue", icon: "▸" };
    return { color: "text-term-fg/70", icon: "›" };
  };

  const stepIcon: Record<StepStatus, string> = {
    done: "✔", running: "⟳", retrying: "⟳", failed: "✘", pending: "○",
  };
  const stepTone: Record<StepStatus, string> = {
    done: "text-positive",
    running: "text-accent",
    retrying: "text-warning",
    failed: "text-danger",
    pending: "text-faint",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Pipeline</h2>
        <span className={`pill ${statusTone[status] ?? statusTone.idle}`}>
          {status === "running" && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
          {status || "idle"}
        </span>
        <span className="ml-auto font-mono text-sm tabular-nums text-subtle">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-fill">
        <div
          className={`h-full rounded-full transition-all duration-500 ${status === "failed" ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Steps */}
        <ol className="space-y-1">
          {AGENT_ORDER.map((agentKey, i) => {
            const s = getAgentStatus(agentKey);
            const active = s === "running" || s === "retrying";
            return (
              <li
                key={agentKey}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${active ? "bg-accent/[0.06]" : ""}`}
              >
                <span className={`w-4 text-center text-sm ${stepTone[s]} ${active ? "animate-pulse" : ""}`}>
                  {stepIcon[s]}
                </span>
                <span className={`flex-1 truncate text-sm ${s === "pending" ? "text-faint" : "text-ink"}`}>
                  {AGENT_LABELS[agentKey]}
                </span>
                <span className="font-mono text-[11px] text-faint">{i + 1}/7</span>
              </li>
            );
          })}
        </ol>

        {/* Live terminal */}
        <div className="min-w-0">
          {error && (
            <p className="mb-2 font-mono text-xs text-danger">✘ sse_connection_error: {error}</p>
          )}
          <Terminal title={`lectureos — pipeline/${lectureId.slice(0, 8)} — live`}>
            <div ref={scrollRef} className="term-scroll max-h-[400px] overflow-y-auto">
              {events.length === 0 && (
                <AnimatedSpan className="text-term-muted">$ waiting for pipeline…</AnimatedSpan>
              )}
              {events.map((e, i) => {
                const { color, icon } = lineFor(e.event_type, e.message || "");
                const ts = new Date(e.timestamp || Date.now()).toISOString().substring(11, 19);
                return (
                  <AnimatedSpan key={i} className={color}>
                    <span className="text-term-muted">{ts}</span>{" "}
                    <span className="text-term-muted">{e.agent_name || "pipeline"} ›</span> {icon} {e.message}
                  </AnimatedSpan>
                );
              })}
              {status === "running" && <span className="term-caret" aria-hidden />}
            </div>
          </Terminal>

          {/* Output actions */}
          {status === "completed" && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <DownloadButton
                lectureId={lectureId}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              />
              {youtubeUrl && !youtubeUrl.includes("dQw4w9WgXcQ") && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-fill"
                >
                  View on YouTube →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
