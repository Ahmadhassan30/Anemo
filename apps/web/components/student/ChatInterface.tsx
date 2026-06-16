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
    <div className="flex flex-col h-full bg-zinc-950">
      {/* titlebar */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-100">lecture_chat</h3>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
          query the transcript_rag tutor
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <p className="text-sm text-zinc-500 font-mono">
            $ no messages yet — ask a question to begin
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`rounded px-3 py-2 max-w-xs text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-zinc-800 text-zinc-200"
                  : "bg-indigo-950 text-zinc-200"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-indigo-400 text-xs font-mono">AI </span>
              )}
              {msg.content}
            </div>

            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-2 w-full max-w-xs space-y-2">
                <span className="uppercase tracking-widest text-[10px] text-zinc-500">citations</span>
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
            <div className="bg-indigo-950 text-zinc-300 rounded px-3 py-2 max-w-xs text-sm font-mono">
              <span className="text-indigo-400 text-xs">AI </span>
              <span className="text-yellow-300 animate-pulse">$ thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ask_a_question..."
          className="bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded flex-1 focus:ring-1 ring-indigo-500 outline-none"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 rounded text-sm transition-colors duration-150"
        >
          send
        </Button>
      </div>
    </div>
  );
}
