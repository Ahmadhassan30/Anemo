"use client";

import { useEffect, useRef, useState } from "react";
import { usePipelineStore } from "@/store/pipeline.store";
import { subscribeToPipeline, type PipelineEvent } from "@/lib/sse-client";
import { api, type AgentRunRecord } from "@/lib/api-client";
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

// Map the backend lecture status to the in-memory pipeline status.
function mapStatus(s: string): "idle" | "running" | "completed" | "failed" {
  if (s === "completed") return "completed";
  if (s === "failed") return "failed";
  if (s === "processing" || s === "pending") return "running";
  return "idle";
}

// Convert a persisted AgentRun row into a replayable terminal log line.
function runToEvent(r: AgentRunRecord, lectureId: string): PipelineEvent {
  const etype: PipelineEvent["event_type"] =
    r.status === "started" ? "AGENT_STARTED" :
    r.status === "success" ? "AGENT_COMPLETED" :
    r.status === "failed" ? "AGENT_FAILED" : "AGENT_RETRYING";
  const icon = r.status === "success" ? "✓" : r.status === "failed" ? "✗" : r.status === "retrying" ? "⟳" : "▸";
  const verb = r.status === "success" ? "completed" : r.status;
  const dur = r.duration_s != null ? ` in ${r.duration_s.toFixed(1)}s` : "";
  let message = `${icon} ${r.agent_name} ${verb}${dur}`;
  if (r.error_message) message += ` — ${r.error_message}`;
  return {
    event_type: etype,
    lecture_id: lectureId,
    agent_name: r.agent_name,
    message,
    progress_pct: 0,
    timestamp: r.finished_at || r.started_at || new Date().toISOString(),
    metadata: {},
  };
}

interface PipelineMonitorProps {
  lectureId: string;
}

export function PipelineMonitor({ lectureId }: PipelineMonitorProps) {
  const { status, currentAgent, progress, events, youtubeUrl, startMonitoring, updateFromEvent, hydrate } =
    usePipelineStore();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Robust reconciliation ────────────────────────────────────────────────
  // Replay persisted state on load, stream live logs via SSE, AND poll the
  // DB-backed /state on an interval so the UI self-heals if the (replay-less)
  // SSE drops mid-render. Fixes "stuck on running / locked download until
  // refresh" once and for all — completion is detected within a few seconds.
  useEffect(() => {
    let cancelled = false;
    let cleanupSSE: () => void = () => {};
    let pollId: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (pollId) { clearInterval(pollId); pollId = null; }
      try { cleanupSSE(); } catch {}
    };

    const handlers = {
      onAgentStarted: updateFromEvent,
      onAgentCompleted: updateFromEvent,
      onAgentFailed: updateFromEvent,
      onPipelineCompleted: updateFromEvent,
      onPipelineFailed: updateFromEvent,
      onProgressUpdate: updateFromEvent,
    };
    const subscribe = async () => {
      const c = await subscribeToPipeline(lectureId, handlers).catch((err) => {
        setError(err.message);
        return () => {};
      });
      if (cancelled) { try { c(); } catch {} return; }
      cleanupSSE = c;
    };

    const progressFromRuns = (runs: AgentRunRecord[]) =>
      Math.min(95, Math.round(
        (new Set(runs.filter((r) => r.status === "success").map((r) => r.agent_name)).size /
          AGENT_ORDER.length) * 100
      ));

    // Full terminal log: prefer the Redis-buffered granular event log (survives
    // SSE drops); fall back to the coarse agent-run timeline.
    const eventsFromState = (st: any): PipelineEvent[] =>
      st.live_events && st.live_events.length
        ? (st.live_events as PipelineEvent[])
        : (st.agent_runs || []).map((r: AgentRunRecord) => runToEvent(r, lectureId));

    const progressFromState = (st: any) => {
      const fromEvents = (st.live_events || []).reduce(
        (m: number, e: any) => Math.max(m, e?.progress_pct || 0), 0
      );
      return Math.max(fromEvents, progressFromRuns(st.agent_runs || []));
    };

    // Authoritative poll: replaces the whole terminal log with the buffered
    // event log every tick, so the view stays current even if SSE is dead, and
    // flips to completed/failed (unlocking download) on its own.
    const poll = async () => {
      try {
        const st = await api.pipeline.getState(lectureId);
        if (cancelled) return;
        const rs = mapStatus(st.status);
        const cur = usePipelineStore.getState();
        hydrate({
          status: rs,
          progress: rs === "completed" ? 100 : Math.max(cur.progress, progressFromState(st)),
          youtubeUrl: st.youtube_url ?? null,
          events: eventsFromState(st),
        });
        if (rs === "completed" || rs === "failed") stop();
      } catch {
        /* transient — the next tick retries */
      }
    };

    (async () => {
      let reconciled: "idle" | "running" | "completed" | "failed" = "running";
      try {
        const st = await api.pipeline.getState(lectureId);
        if (cancelled) return;
        reconciled = mapStatus(st.status);
        const runs = st.agent_runs || [];
        hydrate({
          lectureId,
          status: reconciled,
          events: eventsFromState(st),
          progress: reconciled === "completed" ? 100 : progressFromState(st),
          youtubeUrl: st.youtube_url ?? null,
          currentAgent: reconciled === "running" && runs.length ? runs[runs.length - 1].agent_name : null,
        });
      } catch {
        if (cancelled) return;
        startMonitoring(lectureId);
      }
      if (cancelled) return;
      // While work remains: snappy SSE + a 2.5s authoritative poll of the buffer.
      if (reconciled === "running" || reconciled === "idle") {
        await subscribe();
        if (cancelled) { stop(); return; }
        pollId = setInterval(poll, 2500);
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [lectureId, startMonitoring, updateFromEvent, hydrate]);

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
