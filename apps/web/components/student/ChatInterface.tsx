"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
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
    <div className="flex flex-col h-full bg-background">
      {/* titlebar */}
      <div className="relative px-4 pt-3 pb-2.5 border-b border-border bg-card">
        <div className="absolute left-4 top-[15px] h-2 w-2 rounded-full bg-term-red opacity-85 shadow-[16px_0_0_var(--term-amber),32px_0_0_var(--term-green)]" />
        <div className="pl-12">
          <h3 className="term-caret text-sm font-semibold text-foreground">lecture_chat</h3>
          <p className="text-xs text-muted-foreground">
            <span className="text-primary">{"// "}</span>query the transcript_rag tutor
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">
            <span className="text-primary">{"› "}</span>no messages yet — ask a question to begin
            <span className="term-cursor align-middle" aria-hidden />
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className="mb-1 px-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {msg.role === "user" ? "$ you" : "› tutor"}
            </span>
            <div
              className={`max-w-[90%] px-3 py-2.5 rounded-sm text-sm leading-relaxed border ${
                msg.role === "user"
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-2 w-[90%] space-y-2">
                <span className="term-label text-[10px]">// citations</span>
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
            <span className="mb-1 px-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              › tutor
            </span>
            <div className="max-w-[80%] px-3 py-2.5 rounded-sm border border-border bg-card flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">{"› "}</span>thinking
              <span className="term-cursor" aria-hidden />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card flex gap-2 items-center">
        <span className="text-primary text-sm select-none">$</span>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ask_a_question..."
          className="term-input flex-1"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()} className="term-btn term-btn-primary shrink-0 h-9 px-3">
          <Send className="w-4 h-4" />
          <span className="text-xs">send</span>
        </Button>
      </div>
    </div>
  );
}
