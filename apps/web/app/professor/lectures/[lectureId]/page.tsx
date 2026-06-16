import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PipelineMonitor } from "@/components/professor/PipelineMonitor";
import { DownloadButton } from "@/components/professor/DownloadButton";

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
      ? "pill bg-positive/10 text-positive"
      : lecture.status === "running" || lecture.status === "processing"
      ? "pill bg-accent/10 text-accent"
      : lecture.status === "failed"
      ? "pill bg-danger/10 text-danger"
      : "pill bg-fill text-subtle";

  const conceptStatusColor = (status: string) =>
    status === "completed"
      ? "text-positive"
      : status === "running" || status === "processing"
      ? "text-accent"
      : status === "failed"
      ? "text-danger"
      : "text-faint";

  return (
    <div className="h-screen overflow-hidden bg-canvas flex flex-col">
      {/* TOP BAR */}
      <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-line flex items-center px-6 gap-3 shrink-0">
        <nav className="text-sm flex items-center min-w-0">
          <span className="text-faint">Dashboard</span>
          <span className="text-line-strong mx-1.5">/</span>
          <span className="text-subtle">Lectures</span>
          <span className="text-line-strong mx-1.5">/</span>
          <span className="text-ink font-medium truncate">{lecture.title}</span>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className={statusPill}>
            {(lecture.status === "running" || lecture.status === "processing") && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            )}
            {lecture.status}
          </span>
          {isCompleted && (
            <DownloadButton
              lectureId={params.lectureId}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-60"
            />
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 min-h-0 flex">
        {/* CENTER COLUMN — pipeline / terminal view */}
        <main className="flex-1 min-w-0 overflow-y-auto p-8">
          <PipelineMonitor lectureId={params.lectureId} />
        </main>

        {/* RIGHT INFO PANEL */}
        <aside className="w-96 shrink-0 bg-canvas border-l border-line overflow-y-auto p-6 space-y-8">
          {/* LECTURE INFO */}
          <section>
            <div className="uppercase tracking-widest text-[11px] font-medium text-faint mb-4">
              Lecture info
            </div>
            <div className="rounded-2xl border border-line bg-surface shadow-sm divide-y divide-line">
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="text-sm text-faint shrink-0">Title</span>
                <span className="text-sm text-ink text-right">{lecture.title}</span>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="text-sm text-faint shrink-0">Created</span>
                <span className="text-sm text-subtle text-right">
                  {new Date(lecture.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-faint shrink-0">Status</span>
                <span className={statusPill}>{lecture.status}</span>
              </div>
              {lecture.youtube_url && !lecture.youtube_url.includes("dQw4w9WgXcQ") && (
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-faint shrink-0">YouTube</span>
                  <a
                    href={lecture.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-accent break-all text-right transition-colors duration-200 hover:text-accent-hover"
                  >
                    {lecture.youtube_url}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* CONCEPTS */}
          <section>
            <div className="uppercase tracking-widest text-[11px] font-medium text-faint mb-4">
              Concepts
            </div>
            {lecture.concepts && lecture.concepts.length > 0 ? (
              <ul className="space-y-3">
                {lecture.concepts.map((c: any) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-line bg-surface shadow-sm p-4"
                  >
                    <div className="text-sm font-semibold tracking-tight text-ink">
                      {c.concept}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-faint">
                        [{c.ts_start.toFixed(1)}s — {c.ts_end.toFixed(1)}s]
                      </span>
                      <span
                        className={`font-mono text-[11px] uppercase tracking-widest ${conceptStatusColor(
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
              <p className="text-sm text-subtle">
                No concepts extracted yet.
              </p>
            )}
          </section>

          {/* ACTIONS */}
          <section>
            <div className="uppercase tracking-widest text-[11px] font-medium text-faint mb-4">
              Actions
            </div>
            {isCompleted ? (
              <DownloadButton
                lectureId={params.lectureId}
                className="block w-full text-center rounded-full bg-accent text-white text-sm font-medium px-5 py-2.5 transition-colors duration-200 hover:bg-accent-hover disabled:opacity-60"
              />
            ) : (
              <span className="block w-full text-center rounded-full bg-fill text-subtle text-sm font-medium px-5 py-2.5 cursor-not-allowed">
                ↓ Download
              </span>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
