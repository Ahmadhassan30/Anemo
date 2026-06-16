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
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          <video
            src={URL.createObjectURL(selectedFile)}
            className="h-16 w-28 shrink-0 rounded-xl border border-line object-cover"
            muted
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-subtle">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
            <p className="mt-2 text-xs font-medium text-positive">✓ ready to process</p>
          </div>
          <button
            onClick={removeFile}
            className="text-faint transition-colors duration-200 hover:text-danger"
            aria-label="Remove file"
          >
            ✕
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-fill shadow-none transition-colors duration-200 ${
        dragActive
          ? "border-accent bg-accent/5"
          : "border-line-strong hover:border-accent"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <span className="text-4xl text-faint" aria-hidden>
        ↑
      </span>
      <p className="text-ink">Drop lecture video here</p>
      <p className="text-sm text-subtle">MP4 · MOV · up to 2 GB</p>

      <label htmlFor="file-upload">
        <Button asChild>
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
        <p className="mt-2 text-center text-sm text-danger">
          ✕ {error}
        </p>
      )}
    </Card>
  );
}
