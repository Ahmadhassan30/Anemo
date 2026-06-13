import { getSession } from "next-auth/react";
import { api } from "./api-client";

export interface PipelineEvent {
  event_type: "AGENT_STARTED" | "AGENT_COMPLETED" | "AGENT_FAILED" | "AGENT_RETRYING" | "PIPELINE_COMPLETED" | "PIPELINE_FAILED" | "PROGRESS_UPDATE";
  lecture_id: string;
  agent_name: string | null;
  message: string;
  progress_pct: number;
  timestamp: string;
  metadata: Record<string, any>;
}

interface SubscribeHandlers {
  onAgentStarted: (event: PipelineEvent) => void;
  onAgentCompleted: (event: PipelineEvent) => void;
  onAgentFailed: (event: PipelineEvent) => void;
  onPipelineCompleted: (event: PipelineEvent) => void;
  onPipelineFailed: (event: PipelineEvent) => void;
  onProgressUpdate?: (event: PipelineEvent) => void;
}

export async function subscribeToPipeline(
  lectureId: string,
  handlers: SubscribeHandlers
): Promise<() => void> {
  const session = await getSession();
  const token = session ? (session as any).accessToken : "";
  
  // NOTE: Native EventSource doesn't support custom headers (like Authorization: Bearer).
  // In a real app, we'd either append ?token=... to the URL or use a polyfill (e.g. @microsoft/fetch-event-source).
  // Since we require JWT headers, we will use a small fetch-based EventSource wrapper if needed, 
  // but for standard EventSource we must attach a token query param and update the backend, 
  // or use `fetch-event-source` polyfill. 
  // For standard compatibility per instruction, we use native EventSource but add ?token=
  const url = new URL(api.pipeline.getSseUrl(lectureId));
  if (token) {
    url.searchParams.append("token", token); // backend would need to parse this if auth is strictly required
  }

  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxAttempts = 5;

  const connect = () => {
    if (reconnectAttempts >= maxAttempts) {
      console.error("Max SSE reconnect attempts reached.");
      return;
    }

    eventSource = new EventSource(url.toString());

    // Register typed event listeners
    eventSource.addEventListener("AGENT_STARTED", (e) => {
      handlers.onAgentStarted(JSON.parse((e as MessageEvent).data));
    });

    eventSource.addEventListener("AGENT_COMPLETED", (e) => {
      handlers.onAgentCompleted(JSON.parse((e as MessageEvent).data));
    });

    eventSource.addEventListener("AGENT_FAILED", (e) => {
      handlers.onAgentFailed(JSON.parse((e as MessageEvent).data));
    });

    eventSource.addEventListener("PIPELINE_COMPLETED", (e) => {
      handlers.onPipelineCompleted(JSON.parse((e as MessageEvent).data));
      // Stop reconnecting gracefully when pipeline finishes
      reconnectAttempts = maxAttempts; 
      eventSource?.close();
    });

    eventSource.addEventListener("PIPELINE_FAILED", (e) => {
      handlers.onPipelineFailed(JSON.parse((e as MessageEvent).data));
      reconnectAttempts = maxAttempts;
      eventSource?.close();
    });
    
    eventSource.addEventListener("PROGRESS_UPDATE", (e) => {
      if (handlers.onProgressUpdate) {
        handlers.onProgressUpdate(JSON.parse((e as MessageEvent).data));
      }
    });

    eventSource.onerror = () => {
      eventSource?.close();
      reconnectAttempts++;
      // Reconnect with backoff
      setTimeout(connect, 2000 * reconnectAttempts);
    };
  };

  connect();

  return () => {
    reconnectAttempts = maxAttempts; // prevent reconnect
    if (eventSource) {
      eventSource.close();
    }
  };
}
