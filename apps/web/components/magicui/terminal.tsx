"use client";

/*
 * A macOS-style terminal window with two animated primitives:
 *   - <AnimatedSpan>     a line that fades/slides in (optionally after `delay` ms)
 *   - <TypingAnimation>  a line whose text types out character-by-character
 *
 * Pure CSS/JS (no animation library) so it builds with zero extra deps. Used
 * both for scripted marketing demos and — fed real SSE events — for the live
 * pipeline log view.
 */
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Terminal({
  children,
  className,
  title = "lectureos — zsh",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-black/5 bg-term-bg shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate font-mono text-xs text-term-muted">{title}</span>
      </div>
      <div className="term-scroll max-h-[440px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed text-term-fg">
        {children}
      </div>
    </div>
  );
}

export function AnimatedSpan({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TypingAnimation({
  children,
  delay = 0,
  duration = 35,
  className,
}: {
  children: string;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const text = typeof children === "string" ? children : "";
  const [started, setStarted] = useState(delay === 0);
  const [out, setOut] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    idx.current = 0;
    setOut("");
    const id = setInterval(() => {
      idx.current += 1;
      setOut(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(id);
    }, duration);
    return () => clearInterval(id);
  }, [started, text, duration]);

  return <div className={cn(className)}>{out || " "}</div>;
}
