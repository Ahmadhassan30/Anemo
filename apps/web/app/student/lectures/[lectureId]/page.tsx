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
      <div className="flex h-screen items-center justify-center bg-[#0f1117]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1117] text-slate-300">
        Lecture not found or you are not enrolled.
      </div>
    );
  }

  // Use the local final video if the status is completed, else fallback to raw video
  const videoSrc = lecture.status === "completed" 
    ? `/static/${lectureId}/final.mp4` 
    : (lecture.raw_video_url || "");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row overflow-hidden bg-[#0f1117]">
      
      {/* Mobile Tab Bar (Visible only on small screens) */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900 shrink-0">
        <button onClick={() => setMobileView("video")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileView === "video" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50" : "text-slate-400"}`}>
          <PlayIcon className="w-4 h-4" /> Video
        </button>
        <button onClick={() => setMobileView("notes")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileView === "notes" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50" : "text-slate-400"}`}>
          <ListVideo className="w-4 h-4" /> Notes
        </button>
        <button onClick={() => setMobileView("interactive")} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileView === "interactive" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50" : "text-slate-400"}`}>
          <MessageSquare className="w-4 h-4" /> Interactive
        </button>
      </div>

      {/* Left Column (20%): Notes Panel */}
      <div className={`${mobileView === "notes" ? "block" : "hidden"} md:block w-full md:w-[20%] h-full shrink-0 overflow-hidden`}>
        <NotesPanel />
      </div>

      {/* Center Column (55%): Video Player */}
      <div className={`${mobileView === "video" ? "block" : "hidden"} md:block w-full md:w-[55%] h-full overflow-y-auto p-4 md:p-6 bg-[#0a0c10]`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{lecture.title}</h1>
            <p className="text-slate-500 mt-1">Interactive Lecture Playback</p>
          </div>
          
          <VideoPlayer src={videoSrc} />
        </div>
      </div>

      {/* Right Column (25%): Chat / Quiz */}
      <div className={`${mobileView === "interactive" ? "block" : "hidden"} md:block w-full md:w-[25%] h-full shrink-0 border-l border-slate-800 flex flex-col`}>
        <div className="flex border-b border-slate-800 bg-slate-900 shrink-0">
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === "chat" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === "quiz" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/50" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"}`}
            onClick={() => setActiveTab("quiz")}
          >
            <CheckSquare className="w-4 h-4" /> Quiz
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
