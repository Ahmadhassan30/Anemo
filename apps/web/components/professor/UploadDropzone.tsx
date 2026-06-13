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
      setError("Please upload a video file (mp4, mov, webm).");
      return;
    }
    
    // 2GB limit
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError("File exceeds 2GB maximum size limit.");
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
      className={`border-2 border-dashed transition-colors duration-200 p-8 flex flex-col items-center justify-center min-h-[300px] bg-[#0f1117]/50 ${
        dragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-800 hover:border-slate-700"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="w-32 h-32 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 overflow-hidden">
              {/* Preview via object URL if needed, but a placeholder is fine too */}
              <video 
                src={URL.createObjectURL(selectedFile)} 
                className="w-full h-full object-cover opacity-60"
              />
              <FileVideo className="w-8 h-8 text-blue-500 absolute" />
            </div>
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-slate-800 text-slate-300 p-1 rounded-full hover:bg-slate-700 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-200 truncate max-w-xs">{selectedFile.name}</p>
            <p className="text-sm text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-200">Drag & drop your lecture video here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
            <p className="text-xs text-slate-600 mt-2">MP4, MOV, WEBM up to 2GB</p>
          </div>
          <label htmlFor="file-upload">
            <Button variant="outline" className="mt-4 bg-slate-900 border-slate-800 hover:bg-slate-800" asChild>
              <span>Select File</span>
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
      
      {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
    </Card>
  );
}
