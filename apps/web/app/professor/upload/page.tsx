"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { UploadDropzone as DropzoneComponent } from "@/components/professor/UploadDropzone";

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
    <div className="max-w-2xl mx-auto py-16 px-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  step > s
                    ? "bg-green-400"
                    : step === s
                    ? "bg-indigo-500"
                    : "bg-zinc-700"
                }`}
              />
              <span className="uppercase tracking-widest text-[10px] text-zinc-500">
                {s === 1 ? "Title" : s === 2 ? "Upload" : "Launch"}
              </span>
            </div>
            {s < 3 && (
              <div className={`w-16 h-px ${step > s ? "bg-green-400" : "bg-zinc-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Title */}
      {step === 1 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded p-8">
          <h2 className="text-zinc-100 text-xl font-semibold tracking-tight mb-2">
            Lecture Details
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Give your new lecture a descriptive title.
          </p>
          <input
            placeholder="e.g. Introduction to Calculus"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 px-4 py-3 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors duration-150"
          />
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleCreate}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm px-6 py-2.5 rounded transition-colors duration-150"
            >
              Create Lecture
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-8">
            <h2 className="text-zinc-100 text-xl font-semibold tracking-tight mb-2">
              Upload Video
            </h2>
            <p className="text-zinc-500 text-sm mb-6">
              Select the raw video file to be processed.
            </p>

            <DropzoneComponent onFileSelect={() => {}} />

            {/* Bypass */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="mx-3 uppercase tracking-widest text-[10px] text-zinc-500 font-bold">
                Or Local Dev Bypass
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-3 p-4 rounded border border-zinc-800 bg-zinc-950">
              <p className="text-xs text-zinc-500">
                Bypass cloud upload. Enter a URL accessible from inside docker containers.
              </p>
              <div className="flex gap-2">
                <input
                  value={mockUrl}
                  onChange={(e) => setMockUrl(e.target.value)}
                  className="flex-1 bg-zinc-800 text-zinc-300 placeholder:text-zinc-500 text-xs px-3 py-2 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="http://api:8080/dummy.mp4"
                />
                <button
                  type="button"
                  onClick={handleBypassUpload}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs font-medium px-4 py-2 rounded whitespace-nowrap transition-colors duration-150"
                >
                  Bypass & Confirm
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 text-sm px-4 py-2 rounded transition-colors duration-150"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Launch */}
      {step === 3 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded p-8 text-center">
          <h2 className="text-zinc-100 text-xl font-semibold tracking-tight mb-2">
            Launch Pipeline
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            Video uploaded. Ready to extract concepts and generate animations.
          </p>
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
              </div>
            </div>
          </div>
          <button
            onClick={handleTrigger}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm px-8 py-3 rounded w-full transition-colors duration-150"
          >
            Start Pipeline
          </button>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
}
