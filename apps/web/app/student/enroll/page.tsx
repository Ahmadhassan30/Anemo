"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadCatalog = useCallback(() => {
    Promise.all([
      api.lectures.list(),
      api.students.getEnrolledLectures().catch(() => [] as any[]),
    ])
    .then(([allLecs, enrolled]) => {
      // Show all lectures that are not failed, sorted: completed first, then processing, then pending
      const statusOrder: Record<string, number> = { completed: 0, processing: 1, pending: 2 };
      const available = allLecs
        .filter(l => l.status !== "failed")
        .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
      setAvailableLectures(available);

      const eIds = new Set<string>(enrolled.map((e: any) => e.id as string));
      setEnrolledIds(eIds);
      setLastRefreshed(new Date());
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Auto-refresh every 30 seconds so newly generated lectures appear automatically
  useEffect(() => {
    const interval = setInterval(() => {
      loadCatalog();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadCatalog]);

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

  const getStatusPill = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Ready", cls: "bg-positive/10 text-positive", dot: "bg-positive" };
      case "processing":
        return { label: "Processing", cls: "bg-accent/10 text-accent", dot: "bg-accent animate-pulse" };
      case "pending":
        return { label: "Pending", cls: "bg-fill text-subtle", dot: "bg-faint" };
      default:
        return { label: status, cls: "bg-fill text-subtle", dot: "bg-faint" };
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-faint">Course catalog</p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-ink">
                Discover lectures
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-subtle">
                Browse and enroll in lectures published by your professor.
              </p>
            </div>
            <button
              onClick={loadCatalog}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm text-subtle shadow-sm transition-colors hover:border-line-strong hover:text-ink"
              title="Refresh catalog"
            >
              ↻ Refresh
              <span className="ml-1 text-xs text-faint">
                {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          </div>

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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-fill text-xl text-faint">
              📭
            </div>
            <p className="font-medium text-ink">
              {search ? "No lectures match your search." : "No lectures are available right now."}
            </p>
            {!search && (
              <p className="mt-1.5 text-subtle">
                Ask your professor to publish a lecture — it will appear here automatically.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredLectures.map(lecture => {
              const isEnrolled = enrolledIds.has(lecture.id);
              const { label, cls, dot } = getStatusPill(lecture.status);
              return (
                <Card
                  key={lecture.id}
                  className="flex flex-col transition-all duration-200 hover:shadow-md hover:border-line-strong"
                >
                  <CardHeader>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`pill w-fit ${isEnrolled ? "bg-positive/10 text-positive" : cls}`}>
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isEnrolled ? "bg-positive" : dot}`}
                          aria-hidden
                        />
                        {isEnrolled ? "✓ Enrolled" : label}
                      </span>
                    </div>
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
                    ) : lecture.status === "completed" ? (
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
                    ) : (
                      <Button disabled className="w-full cursor-not-allowed opacity-60" variant="secondary">
                        {lecture.status === "processing" ? "⏳ Still generating…" : "Not ready yet"}
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
