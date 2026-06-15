"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, LectureResponse } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

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
        <p className="term-label">{"// student / enroll"}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          <span className="term-prompt text-muted-foreground" />
          course_catalog
          <span className="term-cursor align-middle" aria-hidden />
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          discover and enroll in available interactive lectures.
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            placeholder="grep --title ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="term-input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="term-panel flex h-40 items-center justify-center text-sm text-muted-foreground">
          <span className="text-primary">{"› "}</span>fetching catalog
          <span className="term-cursor" aria-hidden />
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="term-panel p-12 text-center text-sm text-muted-foreground">
          <span className="text-primary">{"› "}</span>
          {search ? "no_matches — empty result set." : "no_completed_lectures available right now."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLectures.map(lecture => {
            const isEnrolled = enrolledIds.has(lecture.id);
            return (
              <Card key={lecture.id} className="flex flex-col transition-colors hover:border-primary/40">
                <CardHeader>
                  <span className="term-chip mb-2 w-fit">
                    <span className={`h-1.5 w-1.5 rounded-full ${isEnrolled ? "bg-term-cyan" : "bg-primary"}`} />
                    {isEnrolled ? "enrolled" : "available"}
                  </span>
                  <CardTitle className="line-clamp-2 text-base leading-snug">
                    <span className="text-primary">{"› "}</span>{lecture.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary">$ </span>
                    published {new Date(lecture.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="term-rule mt-2 block pt-4">
                  {isEnrolled ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => router.push(`/student/lectures/${lecture.id}`)}
                    >
                      open_lecture
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEnroll(lecture.id)}
                      disabled={enrolling === lecture.id}
                      className="w-full gap-2"
                    >
                      {enrolling === lecture.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                      ) : (
                        <Plus className="h-4 w-4" />
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
