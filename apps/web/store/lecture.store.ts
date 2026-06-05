/*
 * Purpose: Zustand store for lecture data.
 */
import { create } from "zustand";
import type { LectureSummary } from "@/types/lecture";

export type LectureState = {
  lectures: LectureSummary[];
};

export const useLectureStore = create<LectureState>(() => ({
  // TODO: implement lecture fetching and caching
  lectures: []
}));
