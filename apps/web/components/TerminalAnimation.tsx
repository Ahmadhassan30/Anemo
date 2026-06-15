"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const LINES = [
  { text: "$ lectureos upload lecture.mp4", color: "text-zinc-500" },
  { text: "⟳ extracting audio...          [done in 2.1s]", color: "text-yellow-300" },
  { text: "⟳ transcribing with whisper... [done in 8.4s]", color: "text-yellow-300" },
  { text: "⟳ extracting concepts...       [done in 3.2s]", color: "text-yellow-300" },
  { text: "⟳ rendering concept 1/5...     [done in 12.1s]", color: "text-yellow-300" },
  { text: "⟳ rendering concept 2/5...     [done in 9.8s]", color: "text-yellow-300" },
  { text: "✔ pipeline complete → 5 concepts, 4m 32s video", color: "text-green-400" },
  { text: "$ _", color: "text-zinc-500" },
];

export function TerminalAnimation() {
  const [mounted, setMounted] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<{ text: string; color: string }[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  const resetAnimation = useCallback(() => {
    setDisplayedLines([]);
    setCurrentLineIdx(0);
    setCurrentCharIdx(0);
  }, []);

  // Typing effect
  useEffect(() => {
    if (!mounted) return;

    if (currentLineIdx >= LINES.length) {
      // Done — pause then restart
      timeoutRef.current = setTimeout(resetAnimation, 3000);
      return;
    }

    const line = LINES[currentLineIdx];

    if (currentCharIdx === 0) {
      // Start a new line
      setDisplayedLines((prev) => [...prev, { text: "", color: line.color }]);
    }

    if (currentCharIdx < line.text.length) {
      // Type next character
      const delay = 25 + Math.random() * 20;
      timeoutRef.current = setTimeout(() => {
        setDisplayedLines((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            text: line.text.slice(0, currentCharIdx + 1),
          };
          return copy;
        });
        setCurrentCharIdx((c) => c + 1);
      }, delay);
    } else {
      // Line complete — move to next
      timeoutRef.current = setTimeout(() => {
        setCurrentLineIdx((l) => l + 1);
        setCurrentCharIdx(0);
      }, 100);
    }
  }, [mounted, currentLineIdx, currentCharIdx, resetAnimation]);

  if (!mounted) return null;

  return (
    <div className="font-mono text-xs leading-relaxed">
      {displayedLines.map((line, i) => (
        <div key={i} className={line.color}>
          {line.text}
          {i === displayedLines.length - 1 && currentLineIdx < LINES.length && (
            <span className={`${cursorVisible ? "opacity-100" : "opacity-0"} transition-opacity`}>
              |
            </span>
          )}
        </div>
      ))}
      {currentLineIdx >= LINES.length && (
        <span className={`text-green-400 ${cursorVisible ? "opacity-100" : "opacity-0"} transition-opacity`}>
          █
        </span>
      )}
    </div>
  );
}
