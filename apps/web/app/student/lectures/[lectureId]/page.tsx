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
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
        <p className="text-sm text-subtle">Loading lecture…</p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas px-4">
        <div className="max-w-md rounded-2xl border border-line bg-surface px-6 py-5 text-center shadow-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
            ✕
          </div>
          <p className="mt-3 text-base font-semibold tracking-tight text-ink">
            Lecture not found
          </p>
          <p className="mt-1.5 text-sm text-subtle">
            This lecture doesn&apos;t exist or you are not enrolled.
          </p>
        </div>
      </div>
    );
  }

  // Use the local final video once the pipeline has completed, else fall back
  // to the raw upload. The /video endpoint is auth-gated and a <video> element
  // can't send an Authorization header, so the JWT rides along as ?token=.
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const token = (session as any)?.accessToken || "";
  const videoSrc =
    lecture.status === "completed" && token
      ? `${apiBaseUrl}/lectures/${lectureId}/video?token=${encodeURIComponent(token)}`
      : (lecture.raw_video_url || "");

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-canvas md:grid-cols-[1fr_400px]">

      {/* Mobile Tab Bar (Visible only on small screens) */}
      <div className="flex shrink-0 border-b border-line bg-surface md:hidden">
        <button onClick={() => setMobileView("video")} className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors duration-200 ${mobileView === "video" ? "border-b-2 border-accent text-ink" : "text-subtle hover:text-ink"}`}>
          <span aria-hidden>●</span> Video
        </button>
        <button onClick={() => setMobileView("notes")} className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors duration-200 ${mobileView === "notes" ? "border-b-2 border-accent text-ink" : "text-subtle hover:text-ink"}`}>
          <span aria-hidden>≡</span> Notes
        </button>
        <button onClick={() => setMobileView("interactive")} className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors duration-200 ${mobileView === "interactive" ? "border-b-2 border-accent text-ink" : "text-subtle hover:text-ink"}`}>
          <span aria-hidden>○</span> Interactive
        </button>
      </div>

      {/* LEFT: Video area + concept tabs */}
      <div className={`${mobileView === "video" || mobileView === "notes" ? "block" : "hidden"} flex h-full flex-col overflow-hidden md:flex`}>
        {/* Video area */}
        <div className={`${mobileView === "video" ? "block" : "hidden"} aspect-video w-full shrink-0 bg-black md:block`}>
          {videoSrc ? (
            <VideoPlayer src={videoSrc} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black text-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/70" aria-hidden />
              <p className="text-sm text-white/70">
                {lecture.status === "failed"
                  ? "Generation failed — no video is available."
                  : "The animated video is still being generated…"}
              </p>
            </div>
          )}
        </div>

        {/* Lecture meta + concept tabs */}
        <div className={`${mobileView === "notes" ? "block" : "hidden"} flex flex-1 flex-col overflow-hidden border-t border-line bg-canvas md:flex`}>
          <div className="flex shrink-0 items-center gap-3 px-5 py-4">
            <span className={`pill ${lecture.status === "completed" ? "bg-positive/10 text-positive" : "bg-accent/10 text-accent"}`}>
              {lecture.status !== "completed" && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
              {lecture.status === "completed" ? "✓ " : ""}{lecture.status}
            </span>
            <span className="font-mono text-xs text-faint">~/lectures/{lectureId}</span>
          </div>

          {/* Concept tabs — horizontal scroll row */}
          <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-t border-line px-5 py-3">
            <h1 className="whitespace-nowrap border-b-2 border-accent pb-1 text-sm font-semibold tracking-tight text-ink">
              {lecture.title}
            </h1>
            <span className="whitespace-nowrap text-sm text-subtle transition-colors duration-200 hover:text-ink">
              Interactive playback
            </span>
          </div>

          {/* Notes panel content */}
          <div className="flex-1 overflow-y-auto border-t border-line">
            <NotesPanel />
          </div>
        </div>
      </div>

      {/* RIGHT: Chat / Quiz / Notes */}
      <div className={`${mobileView === "interactive" ? "block" : "hidden"} flex h-full shrink-0 flex-col border-l border-line bg-surface md:flex`}>
        <div className="flex shrink-0 border-b border-line px-2">
          <button
            className={`flex h-12 items-center px-4 text-sm font-medium transition-colors duration-200 ${activeTab === "chat" ? "border-b-2 border-accent text-ink" : "text-subtle hover:text-ink"}`}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
          <button
            className={`flex h-12 items-center px-4 text-sm font-medium transition-colors duration-200 ${activeTab === "quiz" ? "border-b-2 border-accent text-ink" : "text-subtle hover:text-ink"}`}
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
