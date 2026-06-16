"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AgentStatusBadge, type AgentStatus } from "./AgentStatusBadge";
import { usePipelineStore } from "@/store/pipeline.store";
import { subscribeToPipeline } from "@/lib/sse-client";

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
  "ingest_agent": "ingest_extract_audio",
  "transcription_agent": "transcribe_audio (whisper)",
  "segmentation_agent": "extract_concepts (deepseek)",
  "codegen_agent": "generate_code_render (manim)",
  "composition_agent": "compose_final_video",
  "rag_indexing_agent": "index_transcript_embeddings (bge)",
  "publish_agent": "publish_to_youtube",
};

interface PipelineMonitorProps {
  lectureId: string;
}

export function PipelineMonitor({ lectureId }: PipelineMonitorProps) {
  const { status, currentAgent, progress, events, youtubeUrl, startMonitoring, updateFromEvent } = usePipelineStore();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startMonitoring(lectureId);

    const cleanupPromise = subscribeToPipeline(lectureId, {
      onAgentStarted: updateFromEvent,
      onAgentCompleted: updateFromEvent,
      onAgentFailed: updateFromEvent,
      onPipelineCompleted: updateFromEvent,
      onPipelineFailed: updateFromEvent,
      onProgressUpdate: updateFromEvent,
    }).catch(err => {
      setError(err.message);
      return () => {};
    });

    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [lectureId, startMonitoring, updateFromEvent]);

  // Auto-scroll to bottom of events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getAgentStatus = (agentKey: string): AgentStatus => {
    // If pipeline failed globally, we might mark active as failed
    if (status === "failed" && currentAgent === agentKey) return "failed";

    // Look for explicit completion or failure events
    const agentEvents = events.filter(e => e.agent_name === agentKey);
    const hasFailed = agentEvents.some(e => e.event_type === "AGENT_FAILED");
    const hasRetrying = agentEvents.some(e => e.event_type === "AGENT_RETRYING");
    const hasCompleted = agentEvents.some(e => e.event_type === "AGENT_COMPLETED");
    const hasStarted = agentEvents.some(e => e.event_type === "AGENT_STARTED");

    if (hasFailed) return "failed";
    if (hasCompleted) return "done";
    if (hasRetrying) return "retrying";
    if (hasStarted || currentAgent === agentKey) return "running";

    // If an agent later in the order is running, this one must be done (fallback)
    const thisIdx = AGENT_ORDER.indexOf(agentKey);
    const curIdx = currentAgent ? AGENT_ORDER.indexOf(currentAgent) : -1;
    if (curIdx > thisIdx) return "done";

    return "pending";
  };

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-300">
      {/* LEFT SIDEBAR — pipeline + concepts */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">
          pipeline
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>{status || "idle"}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="mt-2 h-px w-full bg-zinc-800">
            <div
              className="h-px bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-px">
          {AGENT_ORDER.map((agentKey, index) => {
            const agentStatus = getAgentStatus(agentKey);
            const isActive = agentStatus === "running" || agentStatus === "retrying";

            const errorMsg = agentStatus === "failed"
              ? events.find(e => e.agent_name === agentKey && e.event_type === "AGENT_FAILED")?.message
              : null;

            const icon =
              agentStatus === "done" ? "✔" :
              agentStatus === "running" || agentStatus === "retrying" ? "⟳" :
              agentStatus === "failed" ? "✘" :
              "○";

            const iconColor =
              agentStatus === "done" ? "text-green-400" :
              agentStatus === "running" || agentStatus === "retrying" ? "text-yellow-300 animate-pulse" :
              agentStatus === "failed" ? "text-red-400" :
              "text-zinc-600";

            const labelColor =
              agentStatus === "done" ? "text-green-400" :
              agentStatus === "running" || agentStatus === "retrying" ? "text-yellow-300" :
              agentStatus === "failed" ? "text-red-400" :
              "text-zinc-500";

            return (
              <div
                key={agentKey}
                className={`flex flex-col gap-1 rounded px-2 py-2 text-xs transition-colors duration-150 ${
                  isActive ? "bg-zinc-800" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-4 shrink-0 text-center font-mono ${iconColor}`}>{icon}</span>
                  <span className={`flex-1 truncate font-mono ${labelColor}`}>
                    {AGENT_LABELS[agentKey]}
                  </span>
                  <span className="shrink-0 text-[10px] text-zinc-600">
                    step {index + 1} / 7
                  </span>
                </div>
                {errorMsg && (
                  <p className="break-words pl-6 text-[11px] text-red-400">
                    {"› "}{errorMsg}
                  </p>
                )}
                {isActive && agentKey === "codegen_agent" && (
                  <p className="pl-6 text-[11px] text-yellow-300">
                    {"› "}
                    {events.filter(e => e.event_type === "PROGRESS_UPDATE").pop()?.message || "rendering in parallel..."}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* CONCEPTS section */}
        <div className="mb-3 mt-6 text-[10px] uppercase tracking-widest text-zinc-500">
          concepts
        </div>
        <div className="space-y-px">
          {AGENT_ORDER.map((agentKey) => {
            const agentStatus = getAgentStatus(agentKey);
            const dotColor =
              agentStatus === "done" ? "text-green-400" :
              agentStatus === "running" || agentStatus === "retrying" ? "text-yellow-300 animate-pulse" :
              agentStatus === "failed" ? "text-red-400" :
              "text-zinc-600";

            return (
              <div
                key={`concept-${agentKey}`}
                className="flex items-center gap-2 rounded px-2 py-2 text-xs transition-colors duration-150"
              >
                <span className={`w-4 shrink-0 text-center font-mono ${dotColor}`}>●</span>
                <span className="flex-1 truncate font-mono text-zinc-500">
                  {AGENT_LABELS[agentKey]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Output links */}
        {status === "completed" && (
          <div className="mt-6 space-y-px">
            <a
              href={`/static/${lectureId}/final.mp4`}
              target="_blank"
              rel="noreferrer"
              download
              className="flex items-center gap-2 rounded px-2 py-2 text-xs font-mono text-zinc-300 transition-colors duration-150 hover:bg-zinc-800"
            >
              <span className="w-4 shrink-0 text-center text-green-400">⬇</span>
              download_video
            </a>
            {youtubeUrl && !youtubeUrl.includes("dQw4w9WgXcQ") && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded px-2 py-2 text-xs font-mono text-zinc-300 transition-colors duration-150 hover:bg-zinc-800"
              >
                <span className="w-4 shrink-0 text-center text-indigo-400">→</span>
                view_on_youtube
              </a>
            )}
          </div>
        )}
      </aside>

      {/* CENTER TERMINAL */}
      <div className="flex flex-1 flex-col bg-zinc-950">
        {/* Terminal chrome */}
        <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-3">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-3 font-mono text-[11px] text-zinc-500">
            lectureos — pipeline/{lectureId.slice(0, 8)} — live
          </span>
          <button
            type="button"
            className="ml-auto rounded px-2 py-1 font-mono text-[11px] text-zinc-500 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-300"
          >
            clear
          </button>
        </div>

        {/* SSE connection error */}
        {error && (
          <div className="border-b border-red-800 bg-red-950 px-4 py-2 font-mono text-xs text-red-400">
            ✘ sse_connection_error: {error}
          </div>
        )}

        {/* Log area */}
        <div ref={scrollRef} className="flex-1 space-y-0 overflow-y-auto p-4 font-mono text-xs">
          {events.length === 0 && (
            <div className="text-zinc-700">$ waiting for pipeline...</div>
          )}
          {events.map((e, i) => {
            const line = `[${e.agent_name || "pipeline"}] ${e.message}`;
            const ts = new Date(e.timestamp || Date.now()).toISOString().substring(11, 19);
            const lower = `${e.event_type || ""} ${e.message || ""}`.toLowerCase();

            const lineColor =
              line.includes("✘") || lower.includes("error") || lower.includes("failed") ? "text-red-400" :
              line.includes("✔") || lower.includes("completed") || lower.includes("success") ? "text-green-400" :
              line.includes("⟳") || lower.includes("running") || lower.includes("starting") ? "text-yellow-300" :
              line.startsWith("[pipeline]") ? "text-zinc-500" :
              "text-zinc-400";

            return (
              <div key={i} className={lineColor}>
                <span className="text-zinc-600">{ts} </span>
                {line}
              </div>
            );
          })}
          {status === "running" && (
            <span className="text-green-400 animate-pulse">█</span>
          )}
        </div>

        {/* Status bar */}
        <div className="flex h-8 shrink-0 items-center gap-6 border-t border-zinc-800 bg-zinc-900 px-4 font-mono text-[10px] text-zinc-600">
          <span>status: {status || "idle"}</span>
          <span>progress: {progress}%</span>
          <span>step: {currentAgent ? AGENT_ORDER.indexOf(currentAgent) + 1 : 0} / 7</span>
          <span className="ml-auto">id: {lectureId.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
