"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api-client";

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
      <div className="flex h-[50vh] items-center justify-center bg-zinc-950">
        <p className="font-mono text-sm text-zinc-500">
          <span className="text-green-400">$ </span>
          loading...
        </p>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-zinc-950 px-8 py-12 text-center">
        <p className="mb-6 font-mono text-sm text-zinc-500">$ no enrolled lectures yet</p>
        <Link
          href="/student/enroll"
          className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors duration-150 hover:bg-indigo-400"
        >
          Browse catalog →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="px-8 py-12">
        <h1 className="text-3xl font-light tracking-tight text-zinc-100">Your lectures</h1>
        <p className="mt-2 font-mono text-sm text-zinc-500">
          continue where you left off — {lectures.length} enrolled
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 px-8 pb-12">
        {lectures.map((lecture) => (
          <Link
            key={lecture.id}
            href={`/student/lectures/${lecture.id}`}
            className="flex flex-col rounded border border-zinc-800 bg-zinc-900 p-5 transition-all duration-150 hover:-translate-y-px hover:border-zinc-700"
          >
            <h2 className="line-clamp-2 text-base font-semibold tracking-tight text-zinc-100">{lecture.title}</h2>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded border border-zinc-800 bg-zinc-800 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              ready to watch
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
