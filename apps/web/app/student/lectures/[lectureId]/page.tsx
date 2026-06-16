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
  const [activeTab, setActiveTab] = useState<"chat" | "quiz">("chat");
  const [mobileView, setMobileView] = useState<"video" | "notes" | "interactive">("video");

  const setConcepts = useLectureStore(s => s.setConcepts);
  const resetStore = useLectureStore(s => s.reset);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const lec = await api.lectures.get(lectureId);
        if (!active) return;
        setLecture(lec);

        // Pass concepts to store
        // We know backend returns `concepts` array inside the lecture object
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
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-zinc-950">
        <p className="font-mono text-sm text-zinc-500">
          <span className="text-indigo-400">$ </span>loading_lecture...
        </p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md rounded border border-zinc-800 bg-zinc-900 px-6 py-5 text-center">
          <p className="font-mono text-sm text-red-400">
            <span className="text-indigo-400">{"› "}</span>✘ error: lecture_not_found
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            lecture not found or you are not enrolled.
          </p>
        </div>
      </div>
    );
  }

  // Use the local final video if the status is completed, else fallback to raw video
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";
  const videoSrc = lecture.status === "completed"
    ? `${apiBaseUrl}/lectures/${lectureId}/video?token=${(session as any)?.accessToken || ""}`
    : (lecture.raw_video_url || "");

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-zinc-950 md:grid-cols-[1fr_380px]">

      {/* Mobile Tab Bar (Visible only on small screens) */}
      <div className="flex shrink-0 border-b border-zinc-800 bg-zinc-900 md:hidden">
        <button onClick={() => setMobileView("video")} className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs transition-colors duration-150 ${mobileView === "video" ? "border-b-2 border-indigo-500 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>
          <span aria-hidden>●</span> video
        </button>
        <button onClick={() => setMobileView("notes")} className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs transition-colors duration-150 ${mobileView === "notes" ? "border-b-2 border-indigo-500 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>
          <span aria-hidden>≡</span> notes
        </button>
        <button onClick={() => setMobileView("interactive")} className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs transition-colors duration-150 ${mobileView === "interactive" ? "border-b-2 border-indigo-500 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>
          <span aria-hidden>○</span> interactive
        </button>
      </div>

      {/* LEFT: Video area + concept tabs */}
      <div className={`${mobileView === "video" || mobileView === "notes" ? "block" : "hidden"} flex h-full flex-col overflow-hidden md:flex`}>
        {/* Video area */}
        <div className={`${mobileView === "video" ? "block" : "hidden"} aspect-video w-full shrink-0 bg-black md:block`}>
          <VideoPlayer src={videoSrc} />
        </div>

        {/* Lecture meta + concept tabs */}
        <div className={`${mobileView === "notes" ? "block" : "hidden"} flex flex-1 flex-col overflow-hidden border-t border-zinc-800 bg-zinc-900 md:flex`}>
          <div className="flex shrink-0 items-center gap-3 px-4 py-3">
            <span className={`pill ${lecture.status === "completed" ? "bg-green-950 text-green-400 border-green-800" : "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse"}`}>
              {lecture.status === "completed" ? "✔ " : "⟳ "}{lecture.status}
            </span>
            <span className="font-mono text-[11px] text-zinc-500">~/lectures/{lectureId}</span>
          </div>

          {/* Concept tabs — horizontal scroll row */}
          <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-t border-zinc-800 p-3">
            <h1 className="whitespace-nowrap font-mono text-xs text-indigo-400 border-b border-indigo-400 pb-0.5">
              {lecture.title}
            </h1>
            <span className="whitespace-nowrap font-mono text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-300">
              interactive playback
            </span>
          </div>

          {/* Notes panel content */}
          <div className="flex-1 overflow-y-auto border-t border-zinc-800">
            <NotesPanel />
          </div>
        </div>
      </div>

      {/* RIGHT: Chat / Quiz / Notes */}
      <div className={`${mobileView === "interactive" ? "block" : "hidden"} flex h-full shrink-0 flex-col border-l border-zinc-800 bg-zinc-900 md:flex`}>
        <div className="flex shrink-0 border-b border-zinc-800">
          <button
            className={`flex h-10 items-center px-4 text-xs font-medium transition-colors duration-150 ${activeTab === "chat" ? "border-b-2 border-indigo-500 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
          <button
            className={`flex h-10 items-center px-4 text-xs font-medium transition-colors duration-150 ${activeTab === "quiz" ? "border-b-2 border-indigo-500 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            onClick={() => setActiveTab("quiz")}
          >
            Quiz
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "chat" ? (
            <ChatInterface lectureId={lectureId} />
          ) : (
            <QuizWidget lectureId={lectureId} />
          )}
        </div>
      </div>
    </div>
  );
}
