"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AgentStatusBadge, type AgentStatus } from "./AgentStatusBadge";
import { usePipelineStore } from "@/store/pipeline.store";
import { subscribeToPipeline } from "@/lib/sse-client";
import { PlayCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Card className="term-panel bg-card border-border text-foreground glow-ring">
      <CardHeader className="term-rule rounded-none border-0 pb-4 [border-bottom:1px_solid_hsl(var(--border))]">
        <div className="mb-5 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <PlayCircle className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">{"//"}</span>
            <span className="text-foreground">pipeline_status</span>
            <span className="term-cursor align-middle" aria-hidden />
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="term-chip">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "running"
                    ? "animate-blink bg-primary"
                    : status === "failed"
                    ? "bg-destructive"
                    : status === "completed"
                    ? "bg-primary"
                    : "bg-muted-foreground"
                }`}
              />
              {status || "idle"}
            </span>
            {status === "completed" && (
              <>
                <Button asChild variant="ghost" className="term-btn h-8 gap-2 px-3 text-xs">
                  <a href={`/static/${lectureId}/final.mp4`} target="_blank" rel="noreferrer" download>
                    <PlayCircle className="h-4 w-4 text-primary" />
                    download_video
                  </a>
                </Button>
                {youtubeUrl && !youtubeUrl.includes("dQw4w9WgXcQ") && (
                  <Button asChild variant="ghost" className="term-btn h-8 gap-2 px-3 text-xs">
                    <a href={youtubeUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 text-accent" />
                      view_on_youtube
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="term-label shrink-0">progress</span>
          <Progress value={progress} className="h-1.5 flex-1 rounded-sm bg-secondary" />
          <span className="w-12 text-right font-mono text-sm text-primary glow-text">{progress}%</span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <div className="mb-6 rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <span className="term-prompt font-medium" />
            sse_connection_error: {error}
          </div>
        )}

        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {AGENT_ORDER.map((agentKey, index) => {
            const agentStatus = getAgentStatus(agentKey);
            const isActive = agentStatus === "running" || agentStatus === "retrying";

            // Find specific error message if any
            const errorMsg = agentStatus === "failed"
              ? events.find(e => e.agent_name === agentKey && e.event_type === "AGENT_FAILED")?.message
              : null;

            return (
              <div key={agentKey} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                {/* Node */}
                <div className={`flex items-center justify-center w-2.5 h-2.5 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 -translate-y-4 sm:translate-y-0 transform ${
                  agentStatus === "done" ? "bg-primary border-primary shadow-glow" :
                  agentStatus === "running" ? "bg-primary border-primary animate-blink shadow-glow" :
                  agentStatus === "failed" ? "bg-destructive border-destructive" :
                  "bg-muted-foreground border-border"
                }`}></div>

                {/* Content */}
                <div className={`w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-md border transition-colors ${
                  isActive ? "border-primary/40 bg-secondary/60 glow-ring" :
                  agentStatus === "failed" ? "border-destructive/40 bg-destructive/[0.04]" :
                  "border-border bg-card/60"
                }`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="term-caret truncate font-semibold text-foreground">{AGENT_LABELS[agentKey]}</h3>
                    <AgentStatusBadge status={agentStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    step {String(index + 1).padStart(2, "0")} / {String(AGENT_ORDER.length).padStart(2, "0")}
                  </p>

                  {errorMsg && (
                    <p className="mt-2 break-words text-sm text-destructive">
                      <span className="text-destructive">{"› "}</span>
                      {errorMsg}
                    </p>
                  )}
                  {isActive && agentKey === "codegen_agent" && (
                    <p className="mt-2 text-xs italic text-primary">
                      <span className="not-italic text-primary">{"› "}</span>
                      {events.filter(e => e.event_type === "PROGRESS_UPDATE").pop()?.message || "rendering in parallel..."}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Event Log Terminal */}
        <div className="mt-8 overflow-hidden rounded-md border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="text-primary">{"//"}</span>
              terminal_output
            </span>
            {status === "running" && (
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
                live
              </span>
            )}
          </div>
          <div ref={scrollRef} className="h-48 space-y-1 overflow-y-auto p-4 text-xs text-muted-foreground">
            {events.length === 0 && (
              <div className="text-muted-foreground/60">
                <span className="term-prompt text-primary" />
                waiting for pipeline to start
                <span className="term-cursor align-middle" aria-hidden />
              </div>
            )}
            {events.map((e, i) => (
              <div key={i} className="flex gap-4">
                <span className="shrink-0 text-muted-foreground/60">
                  {new Date(e.timestamp || Date.now()).toISOString().substring(11, 19)}
                </span>
                <span className={e.event_type && e.event_type.includes("FAILED") ? "text-destructive" : "text-foreground"}>
                  <span className="text-primary">{"› "}</span>
                  [{e.agent_name || "SYSTEM"}] {e.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
