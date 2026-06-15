"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, LectureResponse } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 space-y-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">student / enroll</span>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Course Catalog
        </h1>
        <p className="text-xs text-zinc-400">
          Discover and enroll in available interactive lectures.
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search lectures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-550 focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <LoadingSpinner message="fetching catalog..." />
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-12 text-center text-xs text-zinc-500">
          {search ? "No matches found." : "No completed lectures available right now."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLectures.map(lecture => {
            const isEnrolled = enrolledIds.has(lecture.id);
            return (
              <Card key={lecture.id} className="flex flex-col bg-zinc-900 border-zinc-850 p-0 hover:border-zinc-700 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <span className={`pill mb-2 w-fit ${isEnrolled ? "bg-green-950 text-green-400 border-green-900" : "bg-indigo-950 text-indigo-400 border-indigo-900"}`}>
                    {isEnrolled ? "enrolled" : "available"}
                  </span>
                  <CardTitle className="line-clamp-2 text-sm font-medium leading-snug text-zinc-200">
                    {lecture.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 px-4 pb-2">
                  <p className="text-[10px] font-mono text-zinc-500">
                    published {new Date(lecture.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="border-t border-zinc-850 p-4 pt-3 mt-2 block">
                  {isEnrolled ? (
                    <button
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded font-medium transition-colors duration-150 block text-center"
                      onClick={() => router.push(`/student/lectures/${lecture.id}`)}
                    >
                      Open lecture
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(lecture.id)}
                      disabled={enrolling === lecture.id}
                      className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs py-2 rounded font-medium transition-colors duration-150 flex items-center justify-center gap-1.5"
                    >
                      {enrolling === lecture.id ? (
                        <div className="border-2 border-white border-t-transparent rounded-full w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Enroll now
                    </button>
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

