"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api, LectureResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STATUS_STYLES: Record<string, { label: string; dot: string; pill: string }> = {
  pending:    { label: "Pending",    dot: "bg-faint",    pill: "bg-fill text-subtle" },
  processing: { label: "Processing", dot: "bg-accent animate-pulse", pill: "bg-accent/10 text-accent" },
  completed:  { label: "Completed",  dot: "bg-positive", pill: "bg-positive/10 text-positive" },
  failed:     { label: "Failed",     dot: "bg-danger",   pill: "bg-danger/10 text-danger" },
};

export default function ProfessorDashboardPage() {
  const { data: session } = useSession();
  const [lectures, setLectures] = useState<LectureResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      api.lectures.list()
        .then(setLectures)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const statusStyle = (status: string) =>
    STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  if (loading) {
    return (
      <main className="min-h-screen bg-canvas">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-subtle">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Loading lectures…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <header className="mx-auto max-w-5xl px-8 pb-8 pt-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Your lectures</h1>
        <p className="mt-2 text-subtle">
          {lectures.length === 0
            ? "Upload your first lecture to get started."
            : `${lectures.length} lecture${lectures.length !== 1 ? "s" : ""} uploaded`}
        </p>
      </header>

      <div className="mx-auto max-w-5xl px-8 pb-24">
        {lectures.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-6 px-8 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fill text-2xl text-subtle">
              ▸
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-medium text-ink">No lectures yet</p>
              <p className="text-sm text-subtle">
                Upload your first lecture to get started.
              </p>
            </div>
            <Button asChild>
              <Link href="/professor/upload">Upload lecture →</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lectures.map((lecture) => {
              const st = statusStyle(lecture.status);
              return (
                <Link
                  key={lecture.id}
                  href={`/professor/lectures/${lecture.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-base font-semibold tracking-tight text-ink">
                      {lecture.title}
                    </h2>
                    <span className={`pill shrink-0 ${st.pill}`}>
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>

                  <p className="text-xs text-faint">
                    Created {new Date(lecture.created_at).toLocaleDateString()}
                  </p>

                  {lecture.youtube_url && (
                    <a
                      href={lecture.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-auto inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                    >
                      ▶ View on YouTube
                    </a>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/professor/upload"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-sm transition-all duration-200 hover:bg-accent-hover active:scale-[0.98]"
        aria-label="Upload lecture"
      >
        +
      </Link>
    </main>
  );
}
