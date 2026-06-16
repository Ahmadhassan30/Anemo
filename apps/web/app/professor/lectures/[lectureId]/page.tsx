import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PipelineMonitor } from "@/components/professor/PipelineMonitor";

interface PageProps {
  params: Promise<{
    lectureId: string;
  }>;
}

async function getLecture(lectureId: string) {
  const session = await getServerSession(authOptions);
  const token = session ? (session as any).accessToken : "";

  const backendBase = process.env.NEXTAUTH_BACKEND_URL || "http://localhost:8000";
  const API_BASE_URL = `${backendBase}/api/v1`;

  const res = await fetch(`${API_BASE_URL}/lectures/${lectureId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch lecture");
  }

  return res.json();
}

export default async function LectureDetailPage(props: PageProps) {
  const params = await props.params;
  const lecture = await getLecture(params.lectureId);

  if (!lecture) {
    notFound();
  }

  const isCompleted = lecture.status === "completed";

  const statusPill =
    lecture.status === "completed"
      ? "pill bg-green-950 text-green-400 border-green-800"
      : lecture.status === "running" || lecture.status === "processing"
      ? "pill bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse"
      : lecture.status === "failed"
      ? "pill bg-red-950 text-red-400 border-red-800"
      : "pill bg-zinc-800 text-zinc-400 border-zinc-700";

  const conceptStatusColor = (status: string) =>
    status === "completed"
      ? "text-green-400"
      : status === "running" || status === "processing"
      ? "text-yellow-300"
      : status === "failed"
      ? "text-red-400"
      : "text-zinc-500";

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 flex flex-col">
      {/* TOP BAR */}
      <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
        <nav className="font-mono text-xs flex items-center min-w-0">
          <span className="text-zinc-600">dashboard</span>
          <span className="text-zinc-700"> / </span>
          <span className="text-zinc-400">lectures</span>
          <span className="text-zinc-700"> / </span>
          <span className="text-zinc-200 truncate">{lecture.title}</span>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className={statusPill}>{lecture.status}</span>
          {isCompleted && (
            <a
              href={`/static/${params.lectureId}/final.mp4`}
              target="_blank"
              rel="noreferrer"
              download
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded transition-colors duration-150"
            >
              ⬇ download
            </a>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 min-h-0 flex">
        {/* CENTER COLUMN — pipeline / terminal view */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4">
          <PipelineMonitor lectureId={params.lectureId} />
        </main>

        {/* RIGHT INFO PANEL */}
        <aside className="w-80 shrink-0 bg-zinc-900 border-l border-zinc-800 overflow-y-auto p-4 space-y-6">
          {/* LECTURE INFO */}
          <section>
            <div className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3">
              lecture_info
            </div>
            <div className="font-mono text-xs text-zinc-400 space-y-2">
              <div>
                <span className="text-zinc-600">title</span> {lecture.title}
              </div>
              <div>
                <span className="text-zinc-600">created_at</span>{" "}
                {new Date(lecture.created_at).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600">status</span>
                <span className={statusPill}>{lecture.status}</span>
              </div>
              {lecture.youtube_url && !lecture.youtube_url.includes("dQw4w9WgXcQ") && (
                <div>
                  <span className="text-zinc-600">youtube_url</span>{" "}
                  <a
                    href={lecture.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 break-all transition-colors duration-150 hover:text-indigo-300"
                  >
                    {lecture.youtube_url}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* CONCEPTS */}
          <section>
            <div className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3">
              concepts
            </div>
            {lecture.concepts && lecture.concepts.length > 0 ? (
              <ul className="space-y-2.5">
                {lecture.concepts.map((c: any) => (
                  <li
                    key={c.id}
                    className="bg-zinc-950 border border-zinc-800 rounded p-2.5"
                  >
                    <div className="text-sm font-semibold tracking-tight text-zinc-100">
                      {c.concept}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-500">
                        [{c.ts_start.toFixed(1)}s — {c.ts_end.toFixed(1)}s]
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest ${conceptStatusColor(
                          c.render_status
                        )}`}
                      >
                        {c.render_status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-xs text-zinc-500">
                $ no concepts extracted yet...
              </p>
            )}
          </section>

          {/* ACTIONS */}
          <section>
            <div className="uppercase tracking-widest text-[10px] text-zinc-500 mb-3">
              actions
            </div>
            {isCompleted ? (
              <a
                href={`/static/${params.lectureId}/final.mp4`}
                target="_blank"
                rel="noreferrer"
                download
                className="block w-full text-center bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded transition-colors duration-150"
              >
                ⬇ download
              </a>
            ) : (
              <span className="block w-full text-center bg-zinc-800 text-zinc-600 text-xs px-3 py-1.5 rounded cursor-not-allowed">
                ⬇ download
              </span>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
