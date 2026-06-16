"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { CitationCard } from "./CitationCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: any[];
}

interface ChatInterfaceProps {
  lectureId: string;
}

export function ChatInterface({ lectureId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    api.chat.history(lectureId).then((data) => {
      setMessages(data);
    }).catch(console.error);
  }, [lectureId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.chat.send(lectureId, userMsg.content);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.answer,
        citations: response.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${e.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* titlebar */}
      <div className="px-6 py-4 border-b border-line">
        <h3 className="text-base font-semibold tracking-tight text-ink">Lecture chat</h3>
        <p className="text-xs text-faint mt-1">
          Ask the transcript tutor anything about this lecture
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-canvas" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <p className="text-sm text-faint">
            No messages yet — ask a question to begin.
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`rounded-2xl px-4 py-2.5 max-w-sm text-sm leading-relaxed ${
                msg.role === "user"
                  ? "ml-auto bg-fill text-ink"
                  : "bg-accent/8 text-ink"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-accent mb-1">AI</span>
              )}
              {msg.content}
            </div>

            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-3 w-full max-w-sm space-y-2">
                <span className="uppercase tracking-widest text-[10px] text-faint">Citations</span>
                {msg.citations.map((cit, idx) => (
                  <CitationCard
                    key={idx}
                    ts_start={cit.ts_start}
                    chunk_text={cit.chunk_text}
                    concept_id={cit.concept_id}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="bg-accent/8 text-ink rounded-2xl px-4 py-2.5 max-w-sm text-sm">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-accent mb-1">AI</span>
              <span className="inline-flex items-center gap-2 text-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Thinking…
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line p-4 flex gap-3 bg-surface">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          className="flex-1"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          size="icon"
          aria-label="Send"
        >
          →
        </Button>
      </div>
    </Card>
  );
}
