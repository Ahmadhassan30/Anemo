"use client";

import { useCallback, useState } from "react";

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
      setError("Invalid format — expected video (mp4, mov, webm).");
      return;
    }

    // 2GB limit
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError("File too large — exceeds 2 GB maximum.");
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

  return (
    <div
      className={`relative border-2 border-dashed rounded min-h-[256px] flex flex-col items-center justify-center gap-3 transition-colors duration-150 ${
        dragActive
          ? "bg-indigo-950/20 border-indigo-500"
          : selectedFile
          ? "border-zinc-800 bg-zinc-900"
          : "border-zinc-700 bg-zinc-900 hover:border-indigo-500"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center gap-3 p-4 fade-in">
          <div className="font-mono text-zinc-300 text-sm">{selectedFile.name}</div>
          <div className="text-zinc-500 text-xs">
            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
          </div>
          <div className="text-green-400 text-xs">✔ ready to process</div>
          <button
            onClick={removeFile}
            className="mt-2 text-zinc-600 hover:text-red-400 text-xs transition-colors duration-150"
          >
            ✘ remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl text-zinc-600">↑</span>
          <p className="text-zinc-300">Drop lecture video here</p>
          <p className="text-zinc-500 text-sm font-mono">MP4 · MOV · up to 2 GB</p>
          <label htmlFor="file-upload" className="mt-3 cursor-pointer">
            <span className="border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 text-sm px-4 py-2 rounded transition-colors duration-150 inline-block">
              Select file
            </span>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-4 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
