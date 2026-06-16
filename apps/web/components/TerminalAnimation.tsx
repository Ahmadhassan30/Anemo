/*
 * Purpose: Looping fake-typing terminal used as marketing/auth ambiance.
 * Client-only (typing happens in useEffect after mount, so SSR stays static).
 */
"use client";

import React, { useEffect, useRef, useState } from "react";

const SCRIPT = [
  "$ lectureos upload lecture.mp4",
  "⟳ extracting audio...          [done in 2.1s]",
  "⟳ transcribing with whisper... [done in 8.4s]",
  "⟳ extracting concepts...       [done in 3.2s]",
  "⟳ rendering concept 1/5...     [done in 12.1s]",
  "⟳ rendering concept 2/5...     [done in 9.8s]",
  "✔ pipeline complete → 5 concepts, 4m 32s video",
  "$ _",
];

function lineColor(line: string): string {
  if (line.startsWith("✔")) return "text-green-400";
  if (line.startsWith("⟳")) return "text-yellow-300";
  return "text-zinc-500";
}

export function TerminalAnimation() {
  const [done, setDone] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>("");
  const [cursorOn, setCursorOn] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.current.push(setTimeout(resolve, ms));
      });

    const run = async () => {
      while (!cancelled) {
        setDone([]);
        setCurrent("");
        for (const line of SCRIPT) {
          for (let c = 1; c <= line.length; c++) {
            if (cancelled) return;
            setCurrent(line.slice(0, c));
            await wait(25 + Math.random() * 20);
          }
          if (cancelled) return;
          setDone((prev) => [...prev, line]);
          setCurrent("");
          await wait(140);
        }
        await wait(3000);
      }
    };
    run();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono text-xs leading-relaxed">
      {done.map((line, i) => (
        <div key={i} className={lineColor(line)}>
          {line}
        </div>
      ))}
      {current.length > 0 && (
        <div className={lineColor(current)}>
          {current}
          <span className="text-zinc-300">{cursorOn ? "|" : " "}</span>
        </div>
      )}
    </div>
  );
}
