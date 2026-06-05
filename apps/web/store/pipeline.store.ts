/*
 * Purpose: Zustand store for live pipeline status updates.
 */
import { create } from "zustand";
import type { AgentStatus } from "@/types/agent";

export type PipelineState = {
  statuses: AgentStatus[];
};

export const usePipelineStore = create<PipelineState>(() => ({
  // TODO: wire SSE updates into this store
  statuses: []
}));
