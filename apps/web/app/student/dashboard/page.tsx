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
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center justify-center text-center p-12 bg-[#0f1117] border border-slate-800 rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Library className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome to LectureOS</h2>
          <p className="text-slate-400 max-w-md mb-8">
            You aren't enrolled in any lectures yet. Browse the catalog to find interactive lessons that bring concepts to life.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-6 h-auto text-lg rounded-xl">
            <Link href="/student/enroll">Browse Available Lectures</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-500" />
            My Learning
          </h1>
          <p className="text-slate-400 mt-2">Continue where you left off</p>
        </div>
        <Button asChild variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">
          <Link href="/student/enroll">Browse Catalog</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lectures.map((lecture) => (
          <Card key={lecture.id} className="bg-[#0f1117] border-slate-800 text-slate-200 hover:border-blue-500/50 transition-colors flex flex-col">
            <CardHeader className="pb-4">
              <div className="w-full aspect-video bg-slate-900 rounded-lg border border-slate-800 mb-4 flex items-center justify-center relative overflow-hidden group">
                <PlayCircle className="w-12 h-12 text-slate-600 group-hover:text-blue-500 transition-colors z-10 relative" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] to-transparent z-0 opacity-80" />
              </div>
              <CardTitle className="text-lg line-clamp-2">{lecture.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ready to watch
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-800">
              <Button asChild className="w-full bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500 transition-all">
                <Link href={`/student/lectures/${lecture.id}`}>
                  Watch Lecture
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
