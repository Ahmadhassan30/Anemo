import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PipelineMonitor } from "@/components/professor/PipelineMonitor";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    lectureId: string;
  }>;
}

async function getLecture(lectureId: string) {
  const session = await getServerSession(authOptions);
  const token = session ? (session as any).accessToken : "";

  const backendBase = process.env.NEXTAUTH_BACKEND_URL || "http://localhost:8000";
  const API_BASE_URL = `${backendBase}/api/v1`;
  
  const res = await fetch(`${API_BASE_URL}/lectures/${lectureId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch lecture");
  }

  return res.json();
}

export default async function LectureDetailPage(props: PageProps) {
  const params = await props.params;
  const lecture = await getLecture(params.lectureId);

  if (!lecture) {
    notFound();
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">{lecture.title}</h1>
        <p className="text-slate-400">Manage your lecture pipeline and concepts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <PipelineMonitor lectureId={params.lectureId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="bg-[#0f1117] border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 capitalize">
                  {lecture.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Created At</p>
                <p className="text-sm">{new Date(lecture.created_at).toLocaleString()}</p>
              </div>
              {lecture.status === "completed" && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Local Video Link</p>
                  <a href={`/static/${params.lectureId}/final.mp4`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline text-sm break-all" download>
                    Download/View Video Locally
                  </a>
                </div>
              )}
              {lecture.youtube_url && !lecture.youtube_url.includes("dQw4w9WgXcQ") && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">YouTube URL</p>
                  <a href={lecture.youtube_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                    {lecture.youtube_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0f1117] border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              {lecture.concepts && lecture.concepts.length > 0 ? (
                <ul className="space-y-3">
                  {lecture.concepts.map((c: any) => (
                    <li key={c.id} className="text-sm pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                      <div className="font-medium text-slate-300">{c.concept}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">{c.ts_start.toFixed(1)}s - {c.ts_end.toFixed(1)}s</span>
                        <Badge variant="outline" className="text-[10px] border-slate-700 bg-slate-800 text-slate-400 uppercase">
                          {c.render_status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No concepts extracted yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
