"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, LectureResponse } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EnrollPage() {
  const router = useRouter();
  const [availableLectures, setAvailableLectures] = useState<LectureResponse[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.lectures.list(1, 100),
      api.students.getEnrolledLectures()
    ])
    .then(([allLecs, enrolled]) => {
      // Only show completed lectures available for enrollment
      const completed = allLecs.items.filter(l => l.status === "completed");
      setAvailableLectures(completed);

      const eIds = new Set(enrolled.map(e => e.id));
      setEnrolledIds(eIds);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (lectureId: string) => {
    setEnrolling(lectureId);
    try {
      await api.students.enroll(lectureId);
      setEnrolledIds(prev => new Set(prev).add(lectureId));
      router.push(`/student/lectures/${lectureId}`);
    } catch (e: any) {
      alert("Enrollment failed: " + e.message);
    } finally {
      setEnrolling(null);
    }
  };

  const filteredLectures = availableLectures.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 space-y-5">
        <p className="uppercase tracking-widest text-[10px] text-zinc-500">{"// student / enroll"}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          course_catalog
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500">
          discover and enroll in available interactive lectures.
        </p>

        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden>⌕</span>
          <Input
            placeholder="grep --title ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded bg-zinc-800 pl-9 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-sm text-zinc-500">
          <span className="font-mono text-indigo-400">{"› "}</span>fetching catalog
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="rounded border border-zinc-800 bg-zinc-900 p-12 text-center text-sm text-zinc-500">
          <span className="font-mono text-indigo-400">{"› "}</span>
          {search ? "no_matches — empty result set." : "no_completed_lectures available right now."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLectures.map(lecture => {
            const isEnrolled = enrolledIds.has(lecture.id);
            return (
              <Card key={lecture.id} className="flex flex-col rounded border border-zinc-800 bg-zinc-900 transition-colors duration-150 hover:border-zinc-700">
                <CardHeader>
                  <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded border border-zinc-800 bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${isEnrolled ? "bg-green-400" : "bg-indigo-500"}`} />
                    {isEnrolled ? "enrolled" : "available"}
                  </span>
                  <CardTitle className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-zinc-100">
                    <span className="text-indigo-400">{"› "}</span>{lecture.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="font-mono text-xs text-zinc-500">
                    <span className="text-indigo-400">$ </span>
                    published {new Date(lecture.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="mt-2 block border-t border-zinc-800 pt-4">
                  {isEnrolled ? (
                    <Button
                      variant="secondary"
                      className="w-full rounded bg-zinc-800 text-zinc-100 transition-colors duration-150 hover:bg-zinc-800"
                      onClick={() => router.push(`/student/lectures/${lecture.id}`)}
                    >
                      open_lecture
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEnroll(lecture.id)}
                      disabled={enrolling === lecture.id}
                      className="w-full gap-2 rounded bg-indigo-500 text-white transition-colors duration-150 hover:bg-indigo-400 disabled:opacity-50"
                    >
                      {enrolling === lecture.id ? (
                        <span className="text-yellow-300 animate-pulse" aria-hidden>⟳</span>
                      ) : (
                        <span aria-hidden>→</span>
                      )}
                      enroll_now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
