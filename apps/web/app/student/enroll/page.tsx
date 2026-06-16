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
    <div className="min-h-screen bg-canvas">
      <div className="container mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-faint">Course catalog</p>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Discover lectures
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-subtle">
            Browse and enroll in available interactive lectures.
          </p>

          <div className="relative max-w-md pt-2">
            <span className="absolute left-4 top-1/2 -translate-y-[2px] text-faint" aria-hidden>⌕</span>
            <Input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-line bg-surface text-sm text-subtle shadow-sm">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
            Fetching catalog…
          </div>
        ) : filteredLectures.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-16 text-center text-sm text-subtle shadow-sm">
            {search ? "No lectures match your search." : "No completed lectures are available right now."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredLectures.map(lecture => {
              const isEnrolled = enrolledIds.has(lecture.id);
              return (
                <Card key={lecture.id} className="flex flex-col transition-all duration-200 hover:shadow-md hover:border-line-strong">
                  <CardHeader>
                    <span
                      className={`pill mb-3 w-fit ${
                        isEnrolled ? "bg-positive/10 text-positive" : "bg-accent/10 text-accent"
                      }`}
                    >
                      {isEnrolled ? (
                        <>✓ Enrolled</>
                      ) : (
                        <>
                          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                          Available
                        </>
                      )}
                    </span>
                    <CardTitle className="line-clamp-2 text-base leading-snug">
                      {lecture.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-faint">
                      Published {new Date(lecture.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="mt-2 block border-t border-line pt-4">
                    {isEnrolled ? (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => router.push(`/student/lectures/${lecture.id}`)}
                      >
                        Open lecture →
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEnroll(lecture.id)}
                        disabled={enrolling === lecture.id}
                        className="w-full"
                      >
                        {enrolling === lecture.id ? (
                          <>
                            <span className="animate-pulse" aria-hidden>●</span>
                            Enrolling…
                          </>
                        ) : (
                          <>Enroll →</>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
