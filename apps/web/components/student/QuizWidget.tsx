"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
      <div className="p-6 space-y-4">
        <div className="h-5 w-1/3 animate-pulse rounded border border-zinc-800 bg-zinc-900/50"></div>
        <div className="h-20 w-full animate-pulse rounded border border-zinc-800 bg-zinc-900/50"></div>
        <div className="h-20 w-full animate-pulse rounded border border-zinc-800 bg-zinc-900/50"></div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <LoadingSpinner message="Generating quiz..." className="flex-col gap-4 text-center items-center scale-110" />
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          AI agent is analyzing lecture concepts and assembling questions. This may take a moment.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-zinc-500 font-mono">
        no quiz available for this lecture.
      </div>
    );
  }

  const resultMap = new Map(results?.results.map(r => [r.quiz_id, r]));

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950">
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-md">
        <h3 className="font-semibold text-zinc-200 text-xs font-mono uppercase tracking-wider">knowledge check</h3>
        {results ? (
          <div className="pill mt-2 bg-indigo-950 text-indigo-400 border-indigo-900">
            score: {results.score} / {results.total}
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-zinc-500">test your understanding of the materials</p>
        )}
      </div>

      <div className="space-y-8 p-4">
        {questions.map((q, idx) => {
          const result = resultMap.get(q.id);

          return (
            <div key={q.id} className="space-y-4">
              <p className="text-xs font-medium leading-relaxed text-zinc-300">
                <span className="mr-2 text-indigo-400 font-mono">{(idx + 1).toString().padStart(2, "0")}.</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.choices.map((choice) => {
                  const letterMatch = choice.match(/^([A-D])[\.\)]?\s*(.*)/i);
                  const letter = letterMatch ? letterMatch[1].toUpperCase() : choice.charAt(0).toUpperCase();

                  const isSelected = answers[q.id] === letter;

                  let stateClass = "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200";
                  if (isSelected) {
                    stateClass = "border-indigo-500 bg-indigo-950/30 text-zinc-250";
                  }

                  if (result) {
                    if (isSelected && result.correct) {
                      stateClass = "border-green-600 bg-green-950/30 text-green-300";
                    } else if (isSelected && !result.correct) {
                      stateClass = "border-red-650 bg-red-950/30 text-red-300";
                    } else {
                      stateClass = "border-zinc-850 bg-zinc-900/20 text-zinc-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleSelect(q.id, letter)}
                      disabled={!!results}
                      className={`flex w-full items-start gap-3 rounded border p-3 text-left text-xs transition-colors ${stateClass}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {result && isSelected ? (
                          result.correct ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${isSelected ? 'border-indigo-500' : 'border-zinc-700'}`}>
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                          </div>
                        )}
                      </div>
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>

              {result && (
                <div className={`rounded border p-3.5 text-xs ${result.correct ? 'border-green-800/40 bg-green-950/20 text-green-300' : 'border-red-800/40 bg-red-950/20 text-red-300'}`}>
                  <p className="mb-1 font-semibold">
                    {result.correct ? 'Correct' : 'Incorrect'}
                  </p>
                  <p className="leading-relaxed opacity-90">{result.explanation}</p>
                </div>
              )}
            </div>
          );
        })}

        {!results && (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs py-2 rounded font-medium transition-colors duration-150"
          >
            Submit quiz
          </button>
        )}
      </div>
    </div>
  );
}

