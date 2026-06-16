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
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">professor / new lecture</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">Upload lecture</h1>
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
                      ? "h-3 w-3 rounded-full bg-green-400 transition-colors duration-150"
                      : step === s.n
                      ? "h-3 w-3 rounded-full bg-indigo-500 transition-colors duration-150"
                      : "h-3 w-3 rounded-full bg-zinc-700 transition-colors duration-150"
                  }
                />
                <span className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={
                    step > s.n
                      ? "mx-2 -mt-6 h-px flex-1 bg-green-400 transition-colors duration-150"
                      : "mx-2 -mt-6 h-px flex-1 bg-zinc-700 transition-colors duration-150"
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-100">Lecture details</CardTitle>
              <CardDescription className="text-zinc-500">Give your new lecture a descriptive title.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-500">title</label>
              <Input
                placeholder="e.g. Introduction to Calculus"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="rounded border-zinc-800 bg-zinc-800 text-zinc-100 transition-colors duration-150"
              />
              {error && (
                <p className="mt-4 text-sm text-red-400">
                  <span className="text-red-400">✘ </span>{error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end border-t border-zinc-800 pt-6">
              <Button
                onClick={handleCreate}
                className="rounded bg-indigo-500 text-zinc-100 transition-colors duration-150 hover:bg-indigo-400"
              >
                Create lecture →
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-100">Upload video</CardTitle>
              <CardDescription className="text-zinc-500">Select the raw video file to be processed.</CardDescription>
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
                  button: "rounded bg-indigo-500 text-zinc-100 transition-colors duration-150 hover:bg-indigo-400",
                  container: "rounded border border-zinc-800 bg-zinc-950",
                  allowedContent: "text-zinc-500"
                }}
              />

              <div className="my-4 flex items-center">
                <Separator className="flex-1 bg-zinc-800" />
                <span className="mx-3 text-[10px] uppercase tracking-widest text-zinc-500">or local dev bypass</span>
                <Separator className="flex-1 bg-zinc-800" />
              </div>

              <div className="space-y-3 rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="font-mono text-xs leading-relaxed text-zinc-500">
                  <span className="text-indigo-400">$ </span>
                  Bypass the S3 cloud upload. Enter a URL accessible from inside the docker containers (e.g. the seeded dummy video).
                </p>
                <div className="flex gap-2">
                  <Input
                    value={mockUrl}
                    onChange={e => setMockUrl(e.target.value)}
                    className="rounded border-zinc-800 bg-zinc-800 font-mono text-xs text-zinc-100 transition-colors duration-150"
                    placeholder="http://api:8080/dummy.mp4"
                  />
                  <Button
                    type="button"
                    onClick={handleBypassUpload}
                    className="whitespace-nowrap rounded bg-indigo-500 text-xs text-zinc-100 transition-colors duration-150 hover:bg-indigo-400"
                  >
                    Bypass and confirm
                  </Button>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-400">
                  <span className="text-red-400">✘ </span>{error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-4 border-t border-zinc-800 pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded border-zinc-700 bg-transparent text-zinc-300 transition-colors duration-150 hover:bg-zinc-800"
              >
                ← Back
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-100">Launch pipeline</CardTitle>
              <CardDescription className="text-zinc-500">Video successfully uploaded. Ready to extract concepts and generate animations.</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="space-y-1.5 rounded border border-zinc-800 bg-zinc-950 px-5 py-4 font-mono text-sm leading-relaxed">
                <p className="text-zinc-100">
                  <span className="text-indigo-400">$ </span>lectureos confirm --upload
                </p>
                <p className="text-zinc-500">
                  <span className="text-indigo-400">› </span>video staged ............ ok
                </p>
                <p className="text-zinc-500">
                  <span className="text-indigo-400">› </span>awaiting pipeline trigger
                </p>
                <p className="pt-1 text-green-400">
                  ✔ ready to run
                </p>
              </div>
            </CardContent>
            <Separator className="bg-zinc-800" />
            <CardFooter className="pt-6">
              <Button
                onClick={handleTrigger}
                className="w-full rounded bg-indigo-500 text-zinc-100 transition-colors duration-150 hover:bg-indigo-400"
              >
                Start pipeline →
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
