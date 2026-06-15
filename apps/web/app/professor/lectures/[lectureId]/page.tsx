"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { api, LectureResponse } from "@/lib/api-client";
import { usePipelineStore } from "@/store/pipeline.store";
import { subscribeToPipeline } from "@/lib/sse-client";
import { AgentStatusBadge } from "@/components/professor/AgentStatusBadge";
import Link from "next/link";

const AGENT_ORDER = [
  "ingest_agent",
  "transcription_agent",
  "segmentation_agent",
  "codegen_agent",
  "composition_agent",
  "rag_indexing_agent",
  "publish_agent",
];

const STEP_LABELS: Record<string, string> = {
  ingest_agent: "Ingest & Extract Audio",
  transcription_agent: "Transcribe (Whisper)",
  segmentation_agent: "Extract Concepts",
  codegen_agent: "Generate & Render (Manim)",
  composition_agent: "Compose Final Video",
  rag_indexing_agent: "Index Embeddings (BGE)",
  publish_agent: "Publish to YouTube",
};

export default function LectureDetailPage() {
  const params = useParams();
  const lectureId = params.lectureId as string;
  const { data: session } = useSession();

  const [lecture, setLecture] = useState<LectureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);

  const { status, currentAgent, progress, events, youtubeUrl, startMonitoring, updateFromEvent } =
    usePipelineStore();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load lecture data
  useEffect(() => {
    if (!session) return;
    api.lectures
      .get(lectureId)
      .then(setLecture)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lectureId, session]);

  // SSE subscription
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
      setSseError(err.message);
      return () => {};
    });
    return () => {
      cleanupPromise.then((cleanup) => cleanup());
    };
  }, [lectureId, startMonitoring, updateFromEvent]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const getAgentStatus = useCallback(
    (agentKey: string) => {
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
    },
    [status, currentAgent, events]
  );

  const isRunning = status === "running";
  const videoReady = status === "completed" || lecture?.status === "completed";
  const isFailed = status === "failed";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = `/api/v1/lectures/${lectureId}/download`;
      link.download = `${lectureId}_final.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const handleRetrigger = async () => {
    try {
      await api.pipeline.trigger(lectureId);
      window.location.reload();
    } catch (e: any) {
      console.error(e);
    }
  };

  const getLogColor = (line: string) => {
    const l = line.toLowerCase();
    if (l.includes("✘") || l.includes("error") || l.includes("failed") || l.includes("fail"))
      return "text-red-400";
    if (l.includes("✔") || l.includes("completed") || l.includes("success"))
      return "text-green-400";
    if (l.includes("⟳") || l.includes("running") || l.includes("starting"))
      return "text-yellow-300";
    if (l.startsWith("[pipeline]")) return "text-zinc-500";
    return "text-zinc-400";
  };

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="border-2 border-indigo-500 border-t-transparent rounded-full w-4 h-4 animate-spin" />
          <span className="font-mono text-xs text-zinc-500">loading lecture...</span>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 font-mono text-sm">Lecture not found.</p>
      </div>
    );
  }

  const concepts = (lecture as any).concepts || [];

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 flex flex-col">
      {/* TOP BAR */}
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center font-mono text-xs gap-1 flex-1 min-w-0">
          <Link href="/professor/dashboard" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            dashboard
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400">lectures</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-200 truncate">{lecture.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AgentStatusBadge status={status === "idle" ? (lecture.status || "pending") : status} />
          {videoReady && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded transition-colors duration-150 disabled:opacity-50"
            >
              {downloading ? "⟳ downloading..." : "⬇ download"}
            </button>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 overflow-hidden grid grid-cols-[240px_1fr_300px]">
        {/* LEFT SIDEBAR */}
        <div className="bg-zinc-900 border-r border-zinc-800 flex flex-col p-3 overflow-y-auto">
          <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3">
            Pipeline
          </span>

          {/* Progress bar */}
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-px bg-zinc-800">
            <div
              className="h-px bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step list */}
          <div className="mt-4 space-y-px">
            {AGENT_ORDER.map((agentKey, i) => {
              const agentStatus = getAgentStatus(agentKey);
              const isActive = agentStatus === "running" || agentStatus === "retrying";
              const icon =
                agentStatus === "done"
                  ? "✔"
                  : agentStatus === "running"
                  ? "⟳"
                  : agentStatus === "failed"
                  ? "✘"
                  : "○";
              const iconColor =
                agentStatus === "done"
                  ? "text-green-400"
                  : agentStatus === "running"
                  ? "text-yellow-300"
                  : agentStatus === "failed"
                  ? "text-red-400"
                  : "text-zinc-600";
              const labelColor =
                agentStatus === "done"
                  ? "text-zinc-300"
                  : agentStatus === "running"
                  ? "text-yellow-300"
                  : agentStatus === "failed"
                  ? "text-red-400"
                  : "text-zinc-600";

              return (
                <div
                  key={agentKey}
                  className={`flex items-center gap-2 px-2 py-2 rounded text-xs ${
                    isActive ? "bg-zinc-800" : ""
                  }`}
                >
                  <span className={`w-4 shrink-0 ${iconColor}`}>{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`${labelColor} truncate`}>
                      {STEP_LABELS[agentKey]}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      step {i + 1} / {AGENT_ORDER.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Concepts section */}
          {concepts.length > 0 && (
            <div className="mt-6">
              <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
                Concepts
              </span>
              {concepts.map((c: any) => {
                const dotColor =
                  c.render_status === "done" || c.render_status === "completed"
                    ? "text-green-400"
                    : c.render_status === "running"
                    ? "text-yellow-300"
                    : c.render_status === "failed"
                    ? "text-red-400"
                    : "text-zinc-600";
                return (
                  <div key={c.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className={dotColor}>●</span>
                    <span className="text-zinc-300 truncate flex-1">{c.concept}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {c.visual_type || "animation"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CENTER TERMINAL */}
        <div className="flex flex-col bg-zinc-950 overflow-hidden">
          {/* Terminal chrome */}
          <div className="h-9 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-zinc-500 text-[11px] font-mono">
              lectureos — pipeline/{lectureId.slice(0, 8)} — live
            </span>
          </div>

          {/* Log output */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {events.length === 0 && (
              <span className="text-zinc-700">$ waiting for pipeline...</span>
            )}
            {events.map((e, i) => {
              const msg = `[${e.agent_name || "SYSTEM"}] ${e.message || e.event_type}`;
              const ts = new Date(e.timestamp || Date.now())
                .toISOString()
                .substring(11, 19);
              return (
                <div key={i} className={getLogColor(msg)}>
                  [{ts}] {msg}
                </div>
              );
            })}
            {isRunning && (
              <span className="text-green-400 animate-pulse">█</span>
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Status bar */}
          <div className="h-8 border-t border-zinc-800 bg-zinc-900 shrink-0 flex items-center px-4 gap-6 font-mono text-[10px] text-zinc-600">
            <span>
              status{" "}
              <span
                className={
                  status === "completed"
                    ? "text-green-400"
                    : status === "running"
                    ? "text-yellow-300"
                    : status === "failed"
                    ? "text-red-400"
                    : "text-zinc-400"
                }
              >
                {status === "idle" ? (lecture.status || "idle") : status}
              </span>
            </span>
            <span>
              progress <span className="text-zinc-400">{progress}%</span>
            </span>
            <span>
              step{" "}
              <span className="text-zinc-400 truncate max-w-32">
                {currentAgent ? STEP_LABELS[currentAgent] || currentAgent : "—"}
              </span>
            </span>
            <span className="ml-auto">
              id <span className="text-zinc-400">{lectureId.slice(0, 8)}</span>
            </span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-zinc-900 border-l border-zinc-800 overflow-y-auto p-4">
          {/* Lecture Info */}
          <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
            Lecture Info
          </span>
          <div className="font-mono text-xs text-zinc-400 space-y-2 mb-6">
            <div>
              <span className="text-zinc-600">title </span>
              {lecture.title}
            </div>
            <div>
              <span className="text-zinc-600">created </span>
              {new Date(lecture.created_at).toLocaleString()}
            </div>
            <div>
              <span className="text-zinc-600">status </span>
              {lecture.status}
            </div>
          </div>

          {/* Concepts */}
          {concepts.length > 0 && (
            <div className="mb-6">
              <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
                Concepts
              </span>
              {concepts.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-zinc-950 border border-zinc-800 rounded p-2.5 mb-1.5"
                >
                  <div className="text-zinc-300 text-xs font-medium">{c.concept}</div>
                  <div className="flex items-center justify-between mt-1">
                    <AgentStatusBadge status={c.render_status || "pending"} className="text-[9px]" />
                    <span className="text-[10px] text-zinc-600">
                      {c.visual_type || "animation"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* YouTube link */}
          {youtubeUrl && !youtubeUrl.includes("dQw4w9WgXcQ") && (
            <div className="mb-6">
              <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-2 block">
                YouTube
              </span>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-xs font-mono break-all transition-colors"
              >
                {youtubeUrl}
              </a>
            </div>
          )}

          {/* Actions */}
          <span className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3 block">
            Actions
          </span>
          <button
            onClick={videoReady ? handleDownload : undefined}
            disabled={!videoReady || downloading}
            className={`w-full text-xs py-2 rounded transition-colors duration-150 ${
              videoReady
                ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {videoReady
              ? downloading
                ? "⟳ downloading..."
                : "⬇ download video"
              : "video not ready"}
          </button>

          {isFailed && (
            <button
              onClick={handleRetrigger}
              className="mt-2 w-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 text-xs py-2 rounded transition-colors duration-150"
            >
              ⟳ re-run pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
