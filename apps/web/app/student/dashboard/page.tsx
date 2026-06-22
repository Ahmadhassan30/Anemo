"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLectures = useCallback(() => {
    if (!session) return;
    api.students.getEnrolledLectures()
      .then(setLectures)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return { pill: "bg-positive/10 text-positive", dot: "bg-positive", label: "Ready to watch" };
      case "processing":
        return { pill: "bg-accent/10 text-accent", dot: "bg-accent animate-pulse", label: "Processing…" };
      case "pending":
        return { pill: "bg-fill text-subtle", dot: "bg-faint", label: "Pending" };
      case "failed":
        return { pill: "bg-danger/10 text-danger", dot: "bg-danger", label: "Failed" };
      default:
        return { pill: "bg-fill text-subtle", dot: "bg-faint", label: status };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-sm text-subtle">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
          Loading your lectures…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6">
        <header className="flex items-center justify-between pt-16 pb-10">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">Your lectures</h1>
            <p className="mt-2 text-[15px] text-subtle">
              {lectures.length === 0
                ? "You haven't enrolled in any lectures yet."
                : `${lectures.length} lecture${lectures.length !== 1 ? "s" : ""} enrolled`}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/student/enroll">Browse catalog →</Link>
          </Button>
        </header>

        {lectures.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fill text-2xl text-subtle">
              📚
            </div>
            <p className="text-lg font-semibold text-ink">No lectures yet</p>
            <p className="mt-2 max-w-sm mx-auto text-[15px] leading-relaxed text-subtle">
              Browse the catalog and enroll in a lecture to start learning with AI-powered summaries, quizzes, and chat.
            </p>
            <Button asChild className="mt-7" size="lg">
              <Link href="/student/enroll">Browse catalog →</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
            {lectures.map((lecture) => {
              const { pill, dot, label } = getStatusStyle(lecture.status);
              return (
                <Link
                  key={lecture.id}
                  href={`/student/lectures/${lecture.id}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                >
                  <h2 className="line-clamp-2 text-lg font-semibold tracking-tight text-ink">
                    {lecture.title}
                  </h2>
                  <p className="mt-2 text-xs text-faint">
                    {lecture.created_at
                      ? `Published ${new Date(lecture.created_at).toLocaleDateString()}`
                      : ""}
                  </p>
                  <span className={`pill mt-5 w-fit ${pill}`}>
                    <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
