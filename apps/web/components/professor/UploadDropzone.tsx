"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  onFileSelect: (file: File | null) => void;
}

export function UploadDropzone({ onFileSelect }: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("video/")) {
      setError("invalid_format — expected video/* (mp4, mov, webm).");
      return;
    }

    // 2GB limit
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError("file_too_large — exceeds 2GB maximum size limit.");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    setError(null);
  };

  if (selectedFile) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
        <div className="flex items-start justify-between gap-4">
          <video
            src={URL.createObjectURL(selectedFile)}
            className="h-16 w-28 shrink-0 rounded border border-zinc-800 object-cover opacity-70"
            muted
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-zinc-300 truncate">{selectedFile.name}</p>
            <p className="text-zinc-500 text-xs font-mono mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
            <p className="text-green-400 text-xs mt-2">✔ ready to process</p>
          </div>
          <button
            onClick={removeFile}
            className="text-zinc-500 hover:text-red-400 transition-colors duration-150 text-sm"
            aria-label="Remove file"
          >
            ✘
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`border-2 border-dashed rounded bg-zinc-900 transition-colors duration-150 h-64 flex flex-col items-center justify-center gap-3 ${
        dragActive
          ? "border-indigo-500 bg-indigo-950/20"
          : "border-zinc-700 hover:border-indigo-500"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <span className="text-4xl text-zinc-600" aria-hidden>
        ↑
      </span>
      <p className="text-zinc-300">Drop lecture video here</p>
      <p className="text-zinc-500 text-sm font-mono">MP4 · MOV · up to 2 GB</p>

      <label htmlFor="file-upload">
        <Button
          className="bg-indigo-500 hover:bg-indigo-400 transition-colors duration-150 rounded text-zinc-100"
          asChild
        >
          <span>Select file</span>
        </Button>
      </label>
      <input
        id="file-upload"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <p className="text-red-400 text-sm mt-2 text-center font-mono">
          ✘ {error}
        </p>
      )}
    </Card>
  );
}
