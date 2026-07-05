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

  const steps = [
    { n: 1 as const, label: "title" },
    { n: 2 as const, label: "upload" },
    { n: 3 as const, label: "launch" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-8 py-16">
      <div className="mb-12">
        <p className="text-[11px] font-medium uppercase tracking-widest text-faint">professor / new lecture</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Upload lecture</h1>
      </div>

      {/* Step indicator: 3 dots connected by lines */}
      <div className="mb-12">
        <div className="flex items-center justify-center">
          {steps.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={
                    step > s.n
                      ? "h-3 w-3 rounded-full bg-positive transition-all duration-200"
                      : step === s.n
                      ? "h-3 w-3 rounded-full bg-accent ring-4 ring-accent/15 transition-all duration-200"
                      : "h-3 w-3 rounded-full bg-fill ring-1 ring-line transition-all duration-200"
                  }
                />
                <span
                  className={
                    step >= s.n
                      ? "mt-3 text-[11px] font-medium uppercase tracking-widest text-ink transition-colors duration-200"
                      : "mt-3 text-[11px] font-medium uppercase tracking-widest text-faint transition-colors duration-200"
                  }
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={
                    step > s.n
                      ? "mx-3 -mt-6 h-px flex-1 bg-positive transition-colors duration-200"
                      : "mx-3 -mt-6 h-px flex-1 bg-line transition-colors duration-200"
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Lecture details</CardTitle>
              <CardDescription>Give your new lecture a descriptive title.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-faint">title</label>
              <Input
                placeholder="e.g. Introduction to Calculus"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {error && (
                <p className="mt-4 text-sm text-danger">
                  <span className="text-danger">✕ </span>{error}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end border-t border-line pt-6">
              <Button onClick={handleCreate}>
                Create lecture →
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Upload video</CardTitle>
              <CardDescription>Select the raw video file to be processed.</CardDescription>
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
                  button: "rounded-full bg-accent text-white transition-colors duration-200 hover:bg-accent-hover",
                  container: "rounded-2xl border border-line bg-fill",
                  allowedContent: "text-faint"
                }}
              />

              <div className="my-4 flex items-center">
                <Separator className="flex-1 bg-line" />
                <span className="mx-3 text-[11px] font-medium uppercase tracking-widest text-faint">or local dev bypass</span>
                <Separator className="flex-1 bg-line" />
              </div>

              <div className="space-y-3 rounded-xl border border-line bg-fill p-4">
                <p className="text-xs leading-relaxed text-subtle">
                  <span className="text-accent">▸ </span>
                  Bypass the S3 cloud upload. Enter a URL accessible from inside the docker containers (e.g. the seeded dummy video).
                </p>
                <div className="flex gap-2">
                  <Input
                    value={mockUrl}
                    onChange={e => setMockUrl(e.target.value)}
                    className="font-mono text-xs"
                    placeholder="http://api:8080/dummy.mp4"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleBypassUpload}
                    className="whitespace-nowrap"
                  >
                    Bypass and confirm
                  </Button>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-danger">
                  <span className="text-danger">✕ </span>{error}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-4 border-t border-line pt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Launch pipeline</CardTitle>
              <CardDescription>Video successfully uploaded. Ready to extract concepts and generate animations.</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="space-y-1.5 rounded-xl border border-line bg-fill px-5 py-4 font-mono text-sm leading-relaxed">
                <p className="text-ink">
                  <span className="text-accent">$ </span>anemo confirm --upload
                </p>
                <p className="text-subtle">
                  <span className="text-accent">› </span>video staged ............ ok
                </p>
                <p className="text-subtle">
                  <span className="text-accent">› </span>awaiting pipeline trigger
                </p>
                <p className="pt-1 text-positive">
                  ✓ ready to run
                </p>
              </div>
            </CardContent>
            <Separator className="bg-line" />
            <CardFooter className="pt-6">
              <Button onClick={handleTrigger} className="w-full">
                Start pipeline →
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
