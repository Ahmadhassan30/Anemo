"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function UploadWizard() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [lectureId, setLectureId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockUrl, setMockUrl] = useState("http://api:8080/dummy.mp4");

  // Step 1
  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setError(null);
    try {
      const res = await api.lectures.create(title);
      setLectureId(res.lecture_id);
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleBypassUpload = async () => {
    if (!lectureId) return;
    if (!mockUrl.trim()) {
      setError("Please enter a valid mock video URL.");
      return;
    }
    setError(null);
    try {
      await api.lectures.confirmUpload(lectureId, mockUrl.trim());
      setStep(3);
    } catch (e: any) {
      setError("Failed to bypass upload: " + e.message);
    }
  };

  // Step 3
  const handleTrigger = async () => {
    if (!lectureId) return;
    try {
      await api.pipeline.trigger(lectureId);
      router.push(`/professor/lectures/${lectureId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <p className="term-label mb-2">{"// professor / new_lecture"}</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            <span className="term-prompt text-primary" />
            upload_lecture
            <span className="term-cursor align-middle" aria-hidden />
          </h1>
          <div className="flex items-center gap-2 text-xs">
            <span className={step >= 1 ? "term-chip border-primary/50 text-primary" : "term-chip"}>
              <span className={step >= 1 ? "h-1.5 w-1.5 rounded-full bg-primary" : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"} />
              1_title
            </span>
            <span className="text-primary/50">{"──›"}</span>
            <span className={step >= 2 ? "term-chip border-primary/50 text-primary" : "term-chip"}>
              <span className={step >= 2 ? "h-1.5 w-1.5 rounded-full bg-primary" : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"} />
              2_upload
            </span>
            <span className="text-primary/50">{"──›"}</span>
            <span className={step >= 3 ? "term-chip border-primary/50 text-primary" : "term-chip"}>
              <span className={step >= 3 ? "h-1.5 w-1.5 rounded-full bg-primary" : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"} />
              3_launch
            </span>
          </div>
        </div>
      </div>

      <Card className="term-window pt-9 text-foreground">
        <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">~/lectureos/upload</div>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="term-caret text-base font-semibold text-foreground">lecture_details</CardTitle>
              <CardDescription className="text-muted-foreground">Give your new lecture a descriptive title.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="term-label mb-2 block">title</label>
              <Input
                placeholder="e.g. Introduction to Calculus"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="term-input"
              />
              {error && (
                <p className="mt-4 text-sm text-destructive">
                  <span className="text-destructive">{"› "}</span>{error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-6">
              <Button onClick={handleCreate} className="term-btn term-btn-primary">
                create_lecture
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="term-caret text-base font-semibold text-foreground">upload_video</CardTitle>
              <CardDescription className="text-muted-foreground">Select the raw video file to be processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UploadDropzone<OurFileRouter, "lectureVideoUploader">
                endpoint="lectureVideoUploader"
                onClientUploadComplete={async (res) => {
                  if (!lectureId) return;
                  try {
                    await api.lectures.confirmUpload(lectureId, res[0].url);
                    setStep(3);
                  } catch (e: any) {
                    setError("Failed to confirm upload: " + e.message);
                  }
                }}
                onUploadError={(err: Error) => {
                  setError(err.message);
                }}
                appearance={{
                  button: "term-btn term-btn-primary",
                  container: "rounded-md border border-border bg-background/40",
                  allowedContent: "text-muted-foreground"
                }}
              />

              <div className="my-4 flex items-center">
                <Separator className="flex-1 bg-border" />
                <span className="mx-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">// or local_dev_bypass</span>
                <Separator className="flex-1 bg-border" />
              </div>

              <div className="term-panel space-y-3 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="text-primary">{"› "}</span>
                  Bypass the S3 cloud upload. Enter a URL accessible from inside the docker containers (e.g. the seeded dummy video).
                </p>
                <div className="flex gap-2">
                  <Input
                    value={mockUrl}
                    onChange={e => setMockUrl(e.target.value)}
                    className="term-input text-xs"
                    placeholder="http://api:8080/dummy.mp4"
                  />
                  <Button
                    type="button"
                    onClick={handleBypassUpload}
                    className="term-btn term-btn-primary whitespace-nowrap text-xs"
                  >
                    bypass_and_confirm
                  </Button>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive">
                  <span className="text-destructive">{"› "}</span>{error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-4 border-t border-border pt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="term-btn">back</Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="term-caret text-base font-semibold text-foreground">launch_pipeline</CardTitle>
              <CardDescription className="text-muted-foreground">Video successfully uploaded. Ready to extract concepts and generate animations.</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="term-panel space-y-1.5 px-5 py-4 text-sm leading-relaxed">
                <p className="text-foreground">
                  <span className="text-primary">$ </span>lectureos confirm --upload
                </p>
                <p className="text-muted-foreground">
                  <span className="text-primary">{"› "}</span>video staged ............ ok
                </p>
                <p className="text-muted-foreground">
                  <span className="text-primary">{"› "}</span>awaiting pipeline trigger
                </p>
                <p className="pt-1 text-primary">
                  ✓ ready to run<span className="term-cursor" aria-hidden />
                </p>
              </div>
            </CardContent>
            <Separator className="bg-border" />
            <CardFooter className="flex justify-end pt-6">
              <Button onClick={handleTrigger} className="term-btn term-btn-primary w-full sm:w-auto">
                $ start_pipeline
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
