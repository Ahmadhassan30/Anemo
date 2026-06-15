"use client";

import { useCallback, useState } from "react";
import { UploadCloud, FileVideo, X } from "lucide-react";
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

  return (
    <Card
      className={`term-panel relative overflow-hidden border border-dashed rounded-md transition-colors duration-200 p-8 flex flex-col items-center justify-center min-h-[300px] bg-card ${
        dragActive ? "border-primary bg-primary/10 glow-ring" : "border-border hover:border-primary/40"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* corner label */}
      <span className="absolute left-4 top-3 text-[11px] text-muted-foreground">
        <span className="text-primary">{"// "}</span>ingest
      </span>

      {selectedFile ? (
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="w-32 h-32 rounded-sm bg-background flex items-center justify-center border border-border overflow-hidden">
              {/* Preview via object URL if needed, but a placeholder is fine too */}
              <video
                src={URL.createObjectURL(selectedFile)}
                className="w-full h-full object-cover opacity-50"
              />
              <FileVideo className="w-8 h-8 text-primary absolute" />
            </div>
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-secondary text-muted-foreground p-1 rounded-sm border border-border hover:border-destructive hover:text-destructive transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center">
            <span className="term-chip mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              file_staged
            </span>
            <p className="font-medium text-foreground truncate max-w-xs">
              <span className="text-primary">{"› "}</span>{selectedFile.name}
            </p>
            <p className="text-sm text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-sm border border-border bg-secondary flex items-center justify-center text-primary">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              <span className="text-primary">{"$ "}</span>drop_lecture_video
              <span className="term-cursor align-middle" aria-hidden />
            </p>
            <p className="text-sm text-muted-foreground mt-1">// or click to browse from your machine</p>
            <p className="text-xs text-muted-foreground/70 mt-2">[ mp4 · mov · webm — max 2gb ]</p>
          </div>
          <label htmlFor="file-upload">
            <Button variant="outline" className="term-btn mt-4" asChild>
              <span>select_file</span>
            </Button>
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
        <p className="text-destructive text-sm mt-4 text-center">
          <span className="text-destructive">{"› "}</span>{error}
        </p>
      )}
    </Card>
  );
}
