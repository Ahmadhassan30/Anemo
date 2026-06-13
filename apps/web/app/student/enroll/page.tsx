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
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-slate-100">Course Catalog</h1>
        <p className="text-slate-400">Discover and enroll in new interactive lectures.</p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by title..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#0f1117] border-slate-800 text-slate-200 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="p-12 text-center border border-slate-800 rounded-xl bg-[#0f1117] text-slate-400">
          {search ? "No lectures found matching your search." : "No new completed lectures available at the moment."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLectures.map(lecture => {
            const isEnrolled = enrolledIds.has(lecture.id);
            return (
              <Card key={lecture.id} className="bg-[#0f1117] border-slate-800 text-slate-200 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2 leading-snug">{lecture.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-slate-500 mb-2">
                    Published: {new Date(lecture.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-slate-800">
                  {isEnrolled ? (
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300"
                      onClick={() => router.push(`/student/lectures/${lecture.id}`)}
                    >
                      Already Enrolled — Go to Lecture
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleEnroll(lecture.id)}
                      disabled={enrolling === lecture.id}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2"
                    >
                      {enrolling === lecture.id ? (
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Enroll Now
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
