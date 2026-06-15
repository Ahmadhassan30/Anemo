"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { CitationCard } from "./CitationCard";

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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <p className="text-zinc-600 text-xs font-mono">
            $ ask a question to begin...
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-zinc-800 text-zinc-200 ml-auto"
                  : "bg-indigo-950 text-zinc-200"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-indigo-400 text-xs font-mono mr-1">AI</span>
              )}
              {msg.content}
            </div>

            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-2 w-[85%] space-y-1.5">
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
            <div className="bg-indigo-950 text-zinc-400 rounded px-3 py-2 text-sm flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">AI</span>
              thinking
              <div className="border-2 border-indigo-500 border-t-transparent rounded-full w-3 h-3 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="bg-zinc-800 text-zinc-100 text-sm px-3 py-2 rounded flex-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-500"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 rounded text-sm transition-colors duration-150 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
