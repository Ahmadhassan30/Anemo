/*
 * Purpose: Shared lecture type definitions.
 */
export type LectureSummary = {
  id: string;
  title: string;
  status: string;
};

export type LectureDetail = LectureSummary & {
  youtubeUrl?: string;
};
