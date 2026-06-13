import { create } from "zustand";

export interface Concept {
  id: string;
  concept: string;
  ts_start: number;
  ts_end: number;
  render_status?: string;
  clip_url?: string;
}

interface LectureState {
  currentTime: number;
  seekTarget: number | null;
  activeConcept: string | null;
  concepts: Concept[];

  setConcepts: (concepts: Concept[]) => void;
  setCurrentTime: (t: number) => void;
  seekTo: (t: number) => void;
  clearSeek: () => void;
  reset: () => void;
}

export const useLectureStore = create<LectureState>((set, get) => ({
  currentTime: 0,
  seekTarget: null,
  activeConcept: null,
  concepts: [],

  setConcepts: (concepts) => set({ concepts }),

  setCurrentTime: (t) => {
    const { concepts } = get();
    // Find the active concept
    const active = concepts.find(c => t >= c.ts_start && t < c.ts_end);
    set({
      currentTime: t,
      activeConcept: active ? active.id : null
    });
  },

  seekTo: (t) => set({ seekTarget: t }),

  clearSeek: () => set({ seekTarget: null }),

  reset: () => set({
    currentTime: 0,
    seekTarget: null,
    activeConcept: null,
    concepts: []
  })
}));
