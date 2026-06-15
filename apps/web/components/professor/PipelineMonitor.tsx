"use client";

import { useEffect, useRef, useState } from "react";
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
  "ingest_agent": "Ingest & Extract Audio",
  "transcription_agent": "Transcribe (Whisper)",
  "segmentation_agent": "Extract Concepts",
  "codegen_agent": "Generate & Render (Manim)",
  "composition_agent": "Compose Final Video",
  "rag_indexing_agent": "Index Embeddings (BGE)",
  "publish_agent": "Publish to YouTube",
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
    if (status === "failed" && currentAgent === agentKey) return "failed";
    const agentEvents = events.filter(e => e.agent_name === agentKey);
    const hasFailed = agentEvents.some(e => e.event_type === "AGENT_FAILED");
    const hasRetrying = agentEvents.some(e => e.event_type === "AGENT_RETRYING");
    const hasCompleted = agentEvents.some(e => e.event_type === "AGENT_COMPLETED");
    const hasStarted = agentEvents.some(e => e.event_type === "AGENT_STARTED");

    if (hasFailed) return "failed";
    if (hasCompleted) return "done";
    if (hasRetrying) return "retrying";
    if (hasStarted || currentAgent === agentKey) return "running";

    const thisIdx = AGENT_ORDER.indexOf(agentKey);
    const curIdx = currentAgent ? AGENT_ORDER.indexOf(currentAgent) : -1;
    if (curIdx > thisIdx) return "done";

    return "pending";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded">
      {/* Header */}
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-zinc-100 text-lg font-semibold tracking-tight">
            Pipeline Status
          </h2>
          <div className="flex items-center gap-2">
            <AgentStatusBadge status={status === "idle" ? "pending" : status} />
            {status === "completed" && (
              <a
                href={`/api/v1/lectures/${lectureId}/download`}
                download
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded transition-colors duration-150"
              >
                ⬇ download
              </a>
            )}
            {youtubeUrl && !youtubeUrl.includes("dQw4w9WgXcQ") && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 text-xs px-3 py-1.5 rounded transition-colors duration-150"
              >
                YouTube →
              </a>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <span className="uppercase tracking-widest text-[10px] text-zinc-500 shrink-0">
            Progress
          </span>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-zinc-400 font-mono text-sm w-10 text-right">{progress}%</span>
        </div>
      </div>

      {/* Agent Steps */}
      <div className="px-5 py-4 space-y-1">
        {AGENT_ORDER.map((agentKey, index) => {
          const agentStatus = getAgentStatus(agentKey);
          const isActive = agentStatus === "running" || agentStatus === "retrying";
          const errorMsg = agentStatus === "failed"
            ? events.find(e => e.agent_name === agentKey && e.event_type === "AGENT_FAILED")?.message
            : null;

          const icon = agentStatus === "done" ? "✔" : agentStatus === "running" ? "⟳" : agentStatus === "failed" ? "✘" : "○";
          const iconColor = agentStatus === "done" ? "text-green-400" : agentStatus === "running" ? "text-yellow-300" : agentStatus === "failed" ? "text-red-400" : "text-zinc-600";

          return (
            <div
              key={agentKey}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm ${
                isActive ? "bg-zinc-800" : ""
              }`}
            >
              <span className={`w-5 shrink-0 text-center ${iconColor}`}>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate ${agentStatus === "done" ? "text-zinc-300" : agentStatus === "running" ? "text-yellow-300" : agentStatus === "failed" ? "text-red-400" : "text-zinc-500"}`}>
                    {AGENT_LABELS[agentKey]}
                  </span>
                  <AgentStatusBadge status={agentStatus} className="text-[9px]" />
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  step {String(index + 1).padStart(2, "0")} / {String(AGENT_ORDER.length).padStart(2, "0")}
                </div>
                {errorMsg && (
                  <p className="mt-1 text-xs text-red-400 break-words">{errorMsg}</p>
                )}
                {isActive && agentKey === "codegen_agent" && (
                  <p className="mt-1 text-xs text-yellow-300/80 italic">
                    {events.filter(e => e.event_type === "PROGRESS_UPDATE").pop()?.message || "rendering in parallel..."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Log */}
      <div className="border-t border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="ml-2 text-zinc-500 text-[11px] font-mono">output</span>
          </div>
          {status === "running" && (
            <span className="text-green-400 text-[11px] font-mono animate-pulse">● live</span>
          )}
        </div>
        <div ref={scrollRef} className="h-48 overflow-y-auto p-4 font-mono text-xs bg-zinc-950 space-y-0.5">
          {events.length === 0 && (
            <div className="text-zinc-700">$ waiting for pipeline to start...</div>
          )}
          {events.map((e, i) => {
            const msg = `[${e.agent_name || "SYSTEM"}] ${e.message}`;
            const ts = new Date(e.timestamp || Date.now()).toISOString().substring(11, 19);
            const color = e.event_type?.includes("FAILED")
              ? "text-red-400"
              : e.event_type?.includes("COMPLETED")
              ? "text-green-400"
              : "text-zinc-400";
            return (
              <div key={i} className={color}>
                <span className="text-zinc-600">{ts}</span> {msg}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="border-t border-zinc-800 px-4 py-3 text-xs text-red-400">
          SSE connection error: {error}
        </div>
      )}
    </div>
  );
}
