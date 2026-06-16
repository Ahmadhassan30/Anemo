"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      api.students.getEnrolledLectures()
        .then(setLectures)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
        <p className="text-sm text-subtle">Loading your lectures…</p>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">No lectures yet</h1>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-subtle">
          You haven&apos;t enrolled in any lectures. Browse the catalog to get started.
        </p>
        <Button asChild className="mt-7" size="lg">
          <Link href="/student/enroll">Browse catalog →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-6">
        <header className="pt-16 pb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-ink">Your lectures</h1>
          <p className="mt-2 text-[15px] text-subtle">
            Continue where you left off — {lectures.length} enrolled
          </p>
        </header>

        <div className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => (
            <Link
              key={lecture.id}
              href={`/student/lectures/${lecture.id}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
            >
              <h2 className="line-clamp-2 text-lg font-semibold tracking-tight text-ink">
                {lecture.title}
              </h2>
              <span className="pill mt-5 w-fit bg-positive/10 text-positive">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-positive" />
                Ready to watch
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
