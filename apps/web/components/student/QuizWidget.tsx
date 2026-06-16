"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
}

interface QuizResult {
  quiz_id: string;
  correct: boolean;
  explanation: string;
}

interface QuizSubmissionResult {
  score: number;
  total: number;
  results: QuizResult[];
}

interface QuizWidgetProps {
  lectureId: string;
}

export function QuizWidget({ lectureId }: QuizWidgetProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuizSubmissionResult | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchQuiz = async () => {
      try {
        const res = await api.students.getQuiz(lectureId);
        if (res && res.status === "generating") {
          setGenerating(true);
          setLoading(false);
        } else {
          setQuestions(res);
          setGenerating(false);
          setLoading(false);
          if (interval) clearInterval(interval);
        }
      } catch (e) {
        console.error("Failed to fetch quiz", e);
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };

    fetchQuiz();

    if (generating) {
      interval = setInterval(fetchQuiz, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lectureId, generating]);

  const handleSelect = (questionId: string, choiceLetter: string) => {
    if (results) return; // Prevent changing answers after submission
    setAnswers(prev => ({ ...prev, [questionId]: choiceLetter }));
  };

  const handleSubmit = async () => {
    try {
      const res = await api.students.submitQuiz(lectureId, answers);
      setResults(res);
    } catch (e) {
      console.error("Failed to submit quiz", e);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3 font-mono text-sm text-zinc-500">
        <p>$ loading quiz...</p>
        <p>$ fetching questions...</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <p className="font-mono text-sm text-yellow-300 animate-pulse">
          ⟳ generating_quiz...
        </p>
        <p className="text-sm leading-relaxed text-zinc-500">
          Agent is analyzing lecture concepts and assembling questions. This may take a moment.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-zinc-500">
        <span className="font-mono text-zinc-600">{"$ "}</span>No quiz available for this lecture.
      </div>
    );
  }

  const resultMap = new Map(results?.results.map(r => [r.quiz_id, r]));

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950">
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900 p-4">
        <h3 className="font-semibold tracking-tight text-zinc-100">Knowledge Check</h3>
        {results ? (
          <div className="pill bg-green-950 text-green-400 border-green-800 mt-2 font-mono">
            score: {results.score} / {results.total}
          </div>
        ) : (
          <p className="mt-1 uppercase tracking-widest text-[10px] text-zinc-500">Test your understanding</p>
        )}
      </div>

      <div className="space-y-3 p-4">
        {questions.map((q, idx) => {
          const result = resultMap.get(q.id);
          const isAnswered = answers[q.id] !== undefined;

          return (
            <div key={q.id} className="bg-zinc-950 border border-zinc-800 rounded p-4 mb-3">
              <p className="text-zinc-200 text-sm font-medium mb-3 leading-relaxed">
                <span className="mr-2 font-mono text-zinc-500">{String(idx + 1).padStart(2, "0")}</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.choices.map((choice) => {
                  // Usually choices are "A. Something", extract letter
                  const letterMatch = choice.match(/^([A-D])[\.\)]?\s*(.*)/i);
                  const letter = letterMatch ? letterMatch[1].toUpperCase() : choice.charAt(0).toUpperCase();

                  const isSelected = answers[q.id] === letter;

                  let stateClass = "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300";
                  if (isSelected) {
                    stateClass = "bg-zinc-900 border-indigo-500 text-indigo-300";
                  }

                  if (result) {
                    if (isSelected && result.correct) {
                      stateClass = "bg-green-950 border-green-800 text-green-400";
                    } else if (isSelected && !result.correct) {
                      stateClass = "bg-red-950 border-red-800 text-red-400";
                    } else {
                      stateClass = "bg-zinc-900 border-zinc-800 text-zinc-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleSelect(q.id, letter)}
                      disabled={!!results}
                      className={`flex w-full items-start gap-3 rounded border px-3 py-2 text-left text-sm transition-colors duration-150 cursor-pointer ${stateClass}`}
                    >
                      <span className="mt-0.5 shrink-0 font-mono">
                        {result && isSelected ? (
                          result.correct ? <span className="text-green-400">✔</span> : <span className="text-red-400">✘</span>
                        ) : (
                          <span className={isSelected ? "text-indigo-400" : "text-zinc-600"}>{isSelected ? "●" : "○"}</span>
                        )}
                      </span>
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>

              {result && (
                <div className={`mt-3 rounded border px-3 py-2 text-sm ${result.correct ? 'bg-green-950 border-green-800 text-green-400' : 'bg-red-950 border-red-800 text-red-400'}`}>
                  <p className="mb-1 font-semibold">
                    {result.correct ? '✔ correct' : '✘ incorrect'}
                  </p>
                  <p className="leading-relaxed text-zinc-300">{result.explanation}</p>
                </div>
              )}
            </div>
          );
        })}

        {!results && (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="w-full rounded bg-indigo-500 hover:bg-indigo-400 py-2 text-sm text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
