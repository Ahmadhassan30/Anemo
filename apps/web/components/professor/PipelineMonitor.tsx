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
  "ingest_agent": "Ingest & Extract Audio",
  "transcription_agent": "Transcribe Audio (Whisper)",
  "segmentation_agent": "Extract Concepts (DeepSeek)",
  "codegen_agent": "Generate Code & Render (Manim)",
  "composition_agent": "Compose Final Video",
  "rag_indexing_agent": "Index Transcript Embeddings (BGE)",
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
    <Card className="bg-[#0f1117] border-slate-800 text-slate-200">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-500" />
            Pipeline Status
          </CardTitle>
          {status === "completed" && youtubeUrl && (
            <Button asChild variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 h-8 gap-2">
              <a href={youtubeUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 text-red-500" />
                View on YouTube
              </a>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Progress value={progress} className="h-2 flex-1 bg-slate-800" />
          <span className="text-sm font-medium w-12 text-right">{progress}%</span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
            SSE Connection Error: {error}
          </div>
        )}

        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
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
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 -translate-y-4 sm:translate-y-0 transform ${
                  agentStatus === "done" ? "bg-emerald-500 border-emerald-900" :
                  agentStatus === "running" ? "bg-blue-500 border-blue-900" :
                  agentStatus === "failed" ? "bg-red-500 border-red-900" :
                  "bg-slate-700 border-slate-900"
                }`}></div>
                
                {/* Content */}
                <div className={`w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border ${
                  isActive ? "bg-slate-800/50 border-blue-500/30" : "bg-slate-900/50 border-slate-800"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-200">{AGENT_LABELS[agentKey]}</h3>
                    <AgentStatusBadge status={agentStatus} />
                  </div>
                  <p className="text-xs text-slate-500">Step {index + 1} of {AGENT_ORDER.length}</p>
                  
                  {errorMsg && (
                    <p className="mt-2 text-sm text-red-400 break-words">{errorMsg}</p>
                  )}
                  {isActive && agentKey === "codegen_agent" && (
                    <p className="mt-2 text-xs text-blue-400 italic">
                      {events.filter(e => e.event_type === "PROGRESS_UPDATE").pop()?.message || "Rendering in parallel..."}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Event Log Terminal */}
        <div className="mt-8 rounded-lg bg-black border border-slate-800 overflow-hidden">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
            <span>Terminal Output</span>
            {status === "running" && <span className="animate-pulse">● Live</span>}
          </div>
          <div ref={scrollRef} className="p-4 h-48 overflow-y-auto font-mono text-xs text-slate-400 space-y-1">
            {events.length === 0 && <div className="text-slate-600">Waiting for pipeline to start...</div>}
            {events.map((e, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-slate-600 shrink-0">
                  {new Date(e.timestamp).toISOString().substring(11, 19)}
                </span>
                <span className={e.event_type.includes("FAILED") ? "text-red-400" : "text-slate-300"}>
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
