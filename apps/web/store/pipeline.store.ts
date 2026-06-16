import { create } from "zustand";
import { PipelineEvent } from "@/lib/sse-client";

interface PipelineState {
  status: "idle" | "running" | "completed" | "failed";
  currentAgent: string | null;
  progress: number; // 0-100
  events: PipelineEvent[];
  lectureId: string | null;
  youtubeUrl: string | null;

  startMonitoring: (lectureId: string) => void;
  updateFromEvent: (event: PipelineEvent) => void;
  hydrate: (snapshot: Partial<PipelineState>) => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  status: "idle",
  currentAgent: null,
  progress: 0,
  events: [],
  lectureId: null,
  youtubeUrl: null,

  startMonitoring: (lectureId) =>
    set({
      lectureId,
      status: "running",
      progress: 0,
      events: [],
      currentAgent: null,
      youtubeUrl: null,
    }),

  updateFromEvent: (event) =>
    set((state) => {
      let nextStatus = state.status;
      let nextYoutubeUrl = state.youtubeUrl;

      if (event.event_type === "PIPELINE_COMPLETED") {
        nextStatus = "completed";
        if (event.metadata?.youtube_url) {
          nextYoutubeUrl = event.metadata.youtube_url;
        }
      } else if (event.event_type === "PIPELINE_FAILED") {
        nextStatus = "failed";
      }

      return {
        events: [...state.events, event],
        progress: event.progress_pct ?? state.progress,
        currentAgent: event.agent_name ?? state.currentAgent,
        status: nextStatus,
        youtubeUrl: nextYoutubeUrl,
      };
    }),

  // Seed the store from a persisted snapshot (replay) WITHOUT resetting to
  // "running" — used on page load so a finished run isn't shown as restarting.
  hydrate: (snapshot) => set((state) => ({ ...state, ...snapshot })),

  reset: () =>
    set({
      status: "idle",
      currentAgent: null,
      progress: 0,
      events: [],
      lectureId: null,
      youtubeUrl: null,
    }),
}));
