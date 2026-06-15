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
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div>
        <div className="term-label mb-3">// lecture_detail</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          <span className="term-prompt text-muted-foreground" />
          {lecture.title}
          <span className="term-cursor align-middle" aria-hidden />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="text-primary">{"› "}</span>
          manage pipeline &amp; extracted_concepts
        </p>
      </div>

      <hr className="term-rule" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-8 lg:col-span-2">
          <PipelineMonitor lectureId={params.lectureId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="term-panel">
            <CardHeader>
              <CardTitle className="term-caret text-sm uppercase tracking-[0.18em] text-muted-foreground">
                metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="term-label mb-2">status</p>
                <Badge variant="outline" className="term-chip capitalize">
                  <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
                  {lecture.status}
                </Badge>
              </div>
              <div>
                <p className="term-label mb-2">created_at</p>
                <p className="text-sm text-foreground">{new Date(lecture.created_at).toLocaleString()}</p>
              </div>
              {lecture.status === "completed" && (
                <div>
                  <p className="term-label mb-2">local_video_link</p>
                  <a href={`/static/${params.lectureId}/final.mp4`} target="_blank" rel="noreferrer" className="term-link break-all text-sm" download>
                    download/view_video_locally
                  </a>
                </div>
              )}
              {lecture.youtube_url && !lecture.youtube_url.includes("dQw4w9WgXcQ") && (
                <div>
                  <p className="term-label mb-2">youtube_url</p>
                  <a href={lecture.youtube_url} target="_blank" rel="noreferrer" className="break-all text-sm text-accent underline-offset-4 transition-colors hover:underline">
                    {lecture.youtube_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="term-panel">
            <CardHeader>
              <CardTitle className="term-caret text-sm uppercase tracking-[0.18em] text-muted-foreground">
                concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lecture.concepts && lecture.concepts.length > 0 ? (
                <ul className="space-y-3">
                  {lecture.concepts.map((c: any) => (
                    <li key={c.id} className="border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                      <div className="term-caret font-medium text-foreground">{c.concept}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">[{c.ts_start.toFixed(1)}s — {c.ts_end.toFixed(1)}s]</span>
                        <Badge variant="outline" className="term-chip text-[10px] uppercase">
                          {c.render_status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary">{"› "}</span>
                  no concepts extracted yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
