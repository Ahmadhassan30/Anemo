"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlayCircle, GraduationCap } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner message="loading enrolled lectures..." />
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/50 rounded-lg p-12 text-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-indigo-400 border border-zinc-700">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="pill bg-zinc-800 text-zinc-400 border-zinc-700 mb-4">
            no enrollments
          </span>
          <h2 className="mb-3 text-xl font-semibold text-zinc-100">
            Welcome to LectureOS
          </h2>
          <p className="mb-8 max-w-md text-xs text-zinc-400 leading-relaxed">
            You are not enrolled in any lectures yet. Browse the available catalog to find animated interactive lessons.
          </p>
          <Link
            href="/student/enroll"
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-4 py-2.5 rounded transition-colors duration-150"
          >
            Browse available lectures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">student</span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            My Learning
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Continue where you left off — {lectures.length} enrolled
          </p>
        </div>
        <Link
          href="/student/enroll"
          className="border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs px-3.5 py-2 rounded transition-colors duration-150"
        >
          Browse catalog
        </Link>
      </div>

      <hr className="border-zinc-800 mb-8" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {lectures.map((lecture) => (
          <Card key={lecture.id} className="flex flex-col bg-zinc-900 border-zinc-850 p-0 hover:border-zinc-700 transition-colors">
            <CardHeader className="p-4 pb-3">
              <div className="group relative mb-3 flex aspect-video w-full items-center justify-center overflow-hidden rounded border border-zinc-800 bg-zinc-950">
                <PlayCircle className="relative z-10 h-10 w-10 text-zinc-500 transition-colors group-hover:text-indigo-400" />
                <span className="absolute left-2.5 top-2.5 z-10 text-[9px] font-mono text-zinc-650">// preview</span>
              </div>
              <CardTitle className="line-clamp-2 text-sm font-medium text-zinc-200">{lecture.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-2">
              <span className="pill bg-indigo-950 text-indigo-400 border-indigo-900">
                ready to watch
              </span>
            </CardContent>
            <CardFooter className="border-t border-zinc-850 p-4 pt-3">
              <Link
                href={`/student/lectures/${lecture.id}`}
                className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-xs py-2 rounded text-center font-medium transition-colors duration-150 block"
              >
                Watch lecture
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

