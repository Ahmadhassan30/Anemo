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
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-black shadow-sm"
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain"
        onClick={togglePlay}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Custom Controls Container */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">

        {/* Seek Bar with Chapter Markers */}
        <div className="group/seek relative mb-4 flex h-1 w-full cursor-pointer items-center rounded-full bg-white/25">
          {/* Progress fill */}
          <div
            className="absolute left-0 h-full rounded-full bg-accent"
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
              className="absolute z-10 h-2.5 w-0.5 -translate-y-1/4 cursor-pointer rounded-full bg-accent transition-colors duration-200 hover:bg-accent-hover"
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
        <div className="flex items-center justify-between text-white/75">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-base leading-none transition-colors duration-200 hover:text-white">
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="group/vol flex items-center gap-2">
              <button onClick={toggleMute} className="text-base leading-none transition-colors duration-200 hover:text-white">
                {isMuted ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 cursor-pointer accent-accent opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100"
              />
            </div>
            <div className="font-mono text-xs tabular-nums">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="text-white/60"> / {formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full border border-white/25 bg-white/10 px-3 py-1 font-mono text-xs text-white transition-colors duration-200 hover:bg-white/20">
                  {playbackRate}x
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-line bg-surface text-ink shadow-sm">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <DropdownMenuItem key={speed} onClick={() => changeSpeed(speed)} className="cursor-pointer font-mono text-xs focus:bg-fill focus:text-ink">
                    <span className="text-accent">{"› "}</span>{speed}x {speed === 1 && "(normal)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={handleFullscreen} className="text-base leading-none transition-colors duration-200 hover:text-white">
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
