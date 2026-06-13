"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { apiClient } from "@/lib/api-client";
import "@uploadthing/react/styles.css";

export default function ProfessorUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [lectureId, setLectureId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Lecture title is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const data = await apiClient.lectures.create(title);
      setLectureId(data.lecture_id);
      setStep(2);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create lecture record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartPipeline = async () => {
    if (!lectureId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await apiClient.pipeline.trigger(lectureId);
      router.push(`/professor/lectures/${lectureId}`);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to start processing pipeline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Create New Lecture
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Transform your raw lecture recordings into interactive animations.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
            {[
              { num: 1, label: "Title" },
              { num: 2, label: "Upload" },
              { num: 3, label: "Launch" },
            ].map((s) => (
              <div key={s.num} className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    step === s.num
                      ? "bg-violet-600 text-white ring-4 ring-violet-500/20"
                      : step > s.num
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === s.num ? "text-violet-400" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Lecture Title */}
          {step === 1 && (
            <form onSubmit={handleCreateLecture} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300">
                  Lecture Title
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Introduction to Neural Networks"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Lecture"}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Upload Video via UploadThing */}
          {step === 2 && lectureId && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-200">Upload Recording</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Upload your video file (up to 2GB).
                </p>
              </div>

              <div className="border border-dashed border-slate-800 bg-slate-950/40 rounded-xl p-4">
                <UploadDropzone<OurFileRouter, "lectureVideoUploader">
                  endpoint="lectureVideoUploader"
                  onClientUploadComplete={async (res) => {
                    if (res && res[0]) {
                      try {
                        setErrorMessage(null);
                        await apiClient.lectures.confirmUpload(lectureId, res[0].url);
                        setStep(3);
                      } catch (err: any) {
                        setErrorMessage(err.message || "Failed to confirm upload with backend.");
                      }
                    }
                  }}
                  onUploadError={(error) => {
                    setErrorMessage(`Upload failed: ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white cursor-pointer px-4 py-2 rounded-lg transition-all",
                    allowedContent: "text-slate-500 text-xs",
                    label: "text-violet-400 hover:text-violet-300 font-medium text-sm transition-colors",
                    container: "bg-transparent border-none py-8",
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                <span>Lecture ID: {lectureId}</span>
                <button
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
                >
                  Change Title
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Launch Pipeline */}
          {step === 3 && lectureId && (
            <div className="space-y-6 text-center">
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-3xl mb-4 border border-emerald-500/20">
                  ✓
                </div>
                <h3 className="text-lg font-medium text-slate-200">Video Uploaded Successfully!</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Ready to launch the animation generation pipeline.
                </p>
              </div>

              <button
                onClick={handleStartPipeline}
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Launching..." : "Start Pipeline"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
