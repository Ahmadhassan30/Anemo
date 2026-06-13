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
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">Upload Lecture</h1>
        <div className="flex gap-2 text-sm font-medium">
          <span className={step >= 1 ? "text-blue-500" : "text-slate-600"}>1. Title</span>
          <span className="text-slate-600">→</span>
          <span className={step >= 2 ? "text-blue-500" : "text-slate-600"}>2. Upload</span>
          <span className="text-slate-600">→</span>
          <span className={step >= 3 ? "text-blue-500" : "text-slate-600"}>3. Launch</span>
        </div>
      </div>

      <Card className="bg-[#0f1117] border-slate-800 text-slate-200">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Lecture Details</CardTitle>
              <CardDescription className="text-slate-400">Give your new lecture a descriptive title.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input 
                placeholder="e.g. Introduction to Calculus" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="bg-slate-900 border-slate-800"
              />
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
                Create Lecture
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription className="text-slate-400">Select the raw video file to be processed.</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone<OurFileRouter>
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
                  button: "bg-blue-600 hover:bg-blue-500 text-white",
                  container: "border-slate-800 bg-slate-900/50",
                  allowedContent: "text-slate-400"
                }}
              />
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-6 gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800">Back</Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Launch Pipeline</CardTitle>
              <CardDescription className="text-slate-400">Video successfully uploaded. Ready to extract concepts and generate animations.</CardDescription>
            </CardHeader>
            <CardContent className="py-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500" />
                </div>
              </div>
            </CardContent>
            <Separator className="bg-slate-800" />
            <CardFooter className="flex justify-end pt-6">
              <Button onClick={handleTrigger} className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                Start Pipeline
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
