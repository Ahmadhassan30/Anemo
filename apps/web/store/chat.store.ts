/*
 * Purpose: Zustand store for chatbot state.
 */
import { create } from "zustand";
import type { ChatMessage } from "@/types/api";

export type ChatState = {
  messages: ChatMessage[];
};

export const useChatStore = create<ChatState>(() => ({
  // TODO: implement chat message state
  messages: []
}));
