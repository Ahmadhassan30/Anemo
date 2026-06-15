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
import { MessageSquare, CheckSquare, ListVideo } from "lucide-react";

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
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">
          <span className="text-primary">$ </span>loading_lecture
          <span className="term-cursor" aria-hidden />
        </p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="term-panel max-w-md px-6 py-5 text-center">
          <p className="text-sm text-destructive">
            <span className="text-primary">{"› "}</span>error: lecture_not_found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            lecture not found or you are not enrolled.
          </p>
        </div>
      </div>
    );
  }

  // Use the local final video if the status is completed, else fallback to raw video
  const videoSrc = lecture.status === "completed"
    ? `/static/${lectureId}/final.mp4`
    : (lecture.raw_video_url || "");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row overflow-hidden bg-background">

      {/* Mobile Tab Bar (Visible only on small screens) */}
      <div className="md:hidden flex border-b border-border bg-card shrink-0">
        <button onClick={() => setMobileView("video")} className={`flex-1 py-3 text-xs flex items-center justify-center gap-2 transition-colors ${mobileView === "video" ? "text-primary border-b-2 border-primary bg-secondary" : "text-muted-foreground hover:text-foreground"}`}>
          <PlayIcon className="w-4 h-4" /> video
        </button>
        <button onClick={() => setMobileView("notes")} className={`flex-1 py-3 text-xs flex items-center justify-center gap-2 transition-colors ${mobileView === "notes" ? "text-primary border-b-2 border-primary bg-secondary" : "text-muted-foreground hover:text-foreground"}`}>
          <ListVideo className="w-4 h-4" /> notes
        </button>
        <button onClick={() => setMobileView("interactive")} className={`flex-1 py-3 text-xs flex items-center justify-center gap-2 transition-colors ${mobileView === "interactive" ? "text-primary border-b-2 border-primary bg-secondary" : "text-muted-foreground hover:text-foreground"}`}>
          <MessageSquare className="w-4 h-4" /> interactive
        </button>
      </div>

      {/* Left Column (20%): Notes Panel */}
      <div className={`${mobileView === "notes" ? "block" : "hidden"} md:block w-full md:w-[20%] h-full shrink-0 overflow-hidden border-r border-border`}>
        <NotesPanel />
      </div>

      {/* Center Column (55%): Video Player */}
      <div className={`${mobileView === "video" ? "block" : "hidden"} md:block w-full md:w-[55%] h-full overflow-y-auto p-4 md:p-6 bg-background`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="term-panel px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="term-chip">
                <span className={`h-1.5 w-1.5 rounded-full ${lecture.status === "completed" ? "bg-primary" : "animate-blink bg-term-amber"}`} />
                {lecture.status}
              </span>
              <span className="text-[11px] text-muted-foreground">~/lectures/{lectureId}</span>
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              <span className="term-prompt text-muted-foreground" />{lecture.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-primary">{"› "}</span>interactive lecture playback
            </p>
          </div>

          <VideoPlayer src={videoSrc} />
        </div>
      </div>

      {/* Right Column (25%): Chat / Quiz */}
      <div className={`${mobileView === "interactive" ? "block" : "hidden"} md:block w-full md:w-[25%] h-full shrink-0 border-l border-border flex flex-col`}>
        <div className="flex border-b border-border bg-card shrink-0">
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs transition-colors ${activeTab === "chat" ? "text-primary border-b-2 border-primary bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="w-4 h-4" /> chat
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs transition-colors ${activeTab === "quiz" ? "text-primary border-b-2 border-primary bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
            onClick={() => setActiveTab("quiz")}
          >
            <CheckSquare className="w-4 h-4" /> quiz
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
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

function PlayIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
