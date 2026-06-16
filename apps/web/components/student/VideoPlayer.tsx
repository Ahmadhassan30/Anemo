"use client";

import { useEffect, useRef, useState } from "react";
import { useLectureStore } from "@/store/lecture.store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const { currentTime, setCurrentTime, seekTarget, clearSeek, concepts } = useLectureStore();

  // Handle Play/Pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  // Sync state every 500ms per requirements
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [setCurrentTime]);

  // Watch for external seeks (e.g. from CitationCard or NotesPanel)
  useEffect(() => {
    if (seekTarget !== null && videoRef.current) {
      videoRef.current.currentTime = seekTarget;
      setCurrentTime(seekTarget); // force update active concept immediately
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
      clearSeek();
    }
  }, [seekTarget, clearSeek, setCurrentTime, isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded border border-zinc-800 bg-black"
    >
      {/* Stream status titlebar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <span className="font-mono text-xs text-zinc-500">
          <span className="text-indigo-400">//</span> playback.stream
        </span>
        <span className="pill bg-zinc-800 text-zinc-400 border-zinc-700 font-mono text-[10px]">
          {isPlaying ? (
            <span className="text-yellow-300 animate-pulse">● playing</span>
          ) : (
            <span className="text-zinc-500">○ paused</span>
          )}
        </span>
      </div>

      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain"
        onClick={togglePlay}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Custom Controls Container */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-zinc-800 bg-zinc-900 p-4 opacity-0 transition-colors duration-150 group-hover:opacity-100">

        {/* Seek Bar with Chapter Markers */}
        <div className="group/seek relative mb-4 flex h-1 w-full cursor-pointer items-center rounded bg-zinc-800">
          {/* Progress fill */}
          <div
            className="absolute left-0 h-full rounded bg-indigo-500"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
          {/* Input range */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          {/* Chapter Markers */}
          {duration > 0 && concepts.map((c) => (
            <div
              key={c.id}
              className="absolute z-10 h-2.5 w-0.5 -translate-y-1/4 cursor-pointer bg-yellow-300 transition-colors duration-150 hover:bg-indigo-400"
              style={{ left: `${(c.ts_start / duration) * 100}%` }}
              title={c.concept}
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.currentTime = c.ts_start;
                  setCurrentTime(c.ts_start);
                }
              }}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-zinc-500">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-base leading-none transition-colors duration-150 hover:text-zinc-100">
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="group/vol flex items-center gap-2">
              <button onClick={toggleMute} className="text-base leading-none transition-colors duration-150 hover:text-zinc-100">
                {isMuted ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 cursor-pointer accent-indigo-500 opacity-0 transition-all duration-150 group-hover/vol:w-20 group-hover/vol:opacity-100"
              />
            </div>
            <div className="font-mono text-xs tabular-nums">
              <span className="text-zinc-300">{formatTime(currentTime)}</span>
              <span className="text-zinc-500"> / {formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-300 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-100">
                  {playbackRate}x
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded border-zinc-800 bg-zinc-900 text-zinc-300">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <DropdownMenuItem key={speed} onClick={() => changeSpeed(speed)} className="cursor-pointer font-mono text-xs focus:bg-zinc-800 focus:text-zinc-100">
                    <span className="text-indigo-400">{"› "}</span>{speed}x {speed === 1 && "(normal)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={handleFullscreen} className="text-base leading-none transition-colors duration-150 hover:text-zinc-100">
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
