"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/student/VideoPlayer";

export default function StudentLecturePage() {
  const params = useParams();
  const lectureId = typeof params.lectureId === "string" ? params.lectureId : undefined;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Lecture Playback
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Review animations and course materials.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <VideoPlayer lectureId={lectureId} />
        </div>
      </div>
    </main>
  );
}
