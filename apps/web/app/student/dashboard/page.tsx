"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Library, GraduationCap } from "lucide-react";

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
        <p className="text-sm text-muted-foreground">
          <span className="text-primary">$ </span>
          loading enrolled_lectures
          <span className="term-cursor align-middle" aria-hidden />
        </p>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="term-window flex flex-col items-center justify-center px-6 pb-12 pt-14 text-center glow-ring">
          <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">~/student/learning</div>
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-sm border border-border text-primary">
            <Library className="h-7 w-7" />
          </div>
          <span className="term-chip mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-term-amber" />
            no_enrollments
          </span>
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            <span className="term-prompt text-muted-foreground" />
            welcome_to <span className="text-primary glow-text">lectureos</span>
          </h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">
            // no lectures enrolled yet. browse the catalog to find interactive lessons
            that bring concepts to life.
          </p>
          <Button asChild className="term-btn term-btn-primary h-auto px-6 py-3 text-base">
            <Link href="/student/enroll">$ browse_available_lectures</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <span className="term-label">// student</span>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-foreground">
            <GraduationCap className="h-7 w-7 text-primary" />
            my_learning
            <span className="term-cursor align-middle" aria-hidden />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="text-primary">{"› "}</span>
            continue where you left off — {lectures.length} enrolled
          </p>
        </div>
        <Button asChild className="term-btn h-auto px-4 py-2">
          <Link href="/student/enroll">browse_catalog</Link>
        </Button>
      </div>

      <hr className="term-rule mb-8" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {lectures.map((lecture) => (
          <Card key={lecture.id} className="term-card flex flex-col p-0 transition-colors hover:border-primary/40">
            <CardHeader className="p-5 pb-4">
              <div className="group relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-sm border border-border bg-background">
                <PlayCircle className="relative z-10 h-12 w-12 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="absolute left-2 top-2 z-10 text-[10px] text-muted-foreground">{"// preview"}</span>
              </div>
              <CardTitle className="term-caret line-clamp-2 text-base font-semibold text-foreground">{lecture.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-5 pb-2">
              <span className="term-chip">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
                ready_to_watch
              </span>
            </CardContent>
            <CardFooter className="border-t border-border p-5 pt-4">
              <Button asChild className="term-btn term-btn-primary w-full">
                <Link href={`/student/lectures/${lecture.id}`}>
                  $ watch_lecture
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
