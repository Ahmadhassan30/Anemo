import React from "react";

export type VideoPlayerProps = {
  src?: string;
  lectureId?: string;
};

export function VideoPlayer({ src, lectureId }: VideoPlayerProps) {
  // During local development, final videos are served via the FastAPI static files mount:
  // http://localhost:8000/static/{lectureId}/final.mp4
  // TODO: upload to S3/Cloudflare R2 in production
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const origin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");
  const videoSrc = lectureId 
    ? `${origin}/static/${lectureId}/final.mp4` 
    : src;

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 hover:border-slate-700">
      <div className="aspect-video relative flex items-center justify-center bg-black">
        {videoSrc ? (
          <video 
            src={videoSrc} 
            controls 
            className="w-full h-full object-contain"
            preload="metadata"
          />
        ) : (
          <div className="text-slate-400 text-sm flex flex-col items-center space-y-2">
            <svg className="w-8 h-8 text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>No video source available</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default VideoPlayer;
