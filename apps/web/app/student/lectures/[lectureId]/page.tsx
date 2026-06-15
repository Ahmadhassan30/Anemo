"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { api, LectureResponse } from "@/lib/api-client";
import { useLectureStore } from "@/store/lecture.store";
import { VideoPlayer } from "@/components/student/VideoPlayer";
import { NotesPanel } from "@/components/student/NotesPanel";
import { ChatInterface } from "@/components/student/ChatInterface";
import { QuizWidget } from "@/components/student/QuizWidget";

export default function StudentLectureView() {
  const params = useParams();
  const lectureId = params.lectureId as string;
  const { data: session } = useSession();

  const [lecture, setLecture] = useState<LectureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "quiz" | "notes">("chat");

  const setConcepts = useLectureStore(s => s.setConcepts);
  const resetStore = useLectureStore(s => s.reset);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const lec = await api.lectures.get(lectureId);
        if (!active) return;
        setLecture(lec);

        if ((lec as any).concepts) {
          setConcepts((lec as any).concepts);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (session) {
      loadData();
    }

    return () => {
      active = false;
      resetStore();
    };
  }, [lectureId, session, setConcepts, resetStore]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="border-2 border-indigo-500 border-t-transparent rounded-full w-4 h-4 animate-spin" />
          <span className="font-mono text-xs text-zinc-500">loading lecture...</span>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 font-mono text-sm">
          Lecture not found or you are not enrolled.
        </p>
      </div>
    );
  }

  const videoSrc = lecture.status === "completed"
    ? `/api/v1/lectures/${lectureId}/video`
    : (lecture.raw_video_url || "");

  const concepts = (lecture as any).concepts || [];

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 grid grid-cols-[1fr_380px]">
      {/* LEFT: Video + Concept Tabs */}
      <div className="flex flex-col overflow-hidden">
        {/* Video */}
        <div className="bg-black flex-shrink-0">
          <VideoPlayer src={videoSrc} />
        </div>

        {/* Concept tabs */}
        {concepts.length > 0 && (
          <div className="bg-zinc-900 border-t border-zinc-800 p-3 overflow-x-auto">
            <div className="flex gap-1">
              {concepts.map((c: any, i: number) => (
                <button
                  key={c.id || i}
                  className="px-3 py-1.5 font-mono text-xs whitespace-nowrap rounded transition-colors duration-150 text-zinc-500 hover:text-zinc-300"
                >
                  {c.concept}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Chat / Quiz / Notes */}
      <div className="bg-zinc-900 border-l border-zinc-800 flex flex-col">
        {/* Tab header */}
        <div className="border-b border-zinc-800 flex shrink-0">
          {(["chat", "quiz", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-10 px-4 flex items-center text-xs font-medium transition-colors duration-150 ${
                activeTab === tab
                  ? "text-zinc-100 border-b-2 border-indigo-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && <ChatInterface lectureId={lectureId} />}
          {activeTab === "quiz" && <QuizWidget lectureId={lectureId} />}
          {activeTab === "notes" && <NotesPanel />}
        </div>
      </div>
    </div>
  );
}
