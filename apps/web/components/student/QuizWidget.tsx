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
      <div className="space-y-3 p-6 text-sm text-subtle">
        <p>Loading quiz…</p>
        <p className="text-faint">Fetching questions…</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <span className="pill bg-accent/10 text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Generating quiz…
        </span>
        <p className="max-w-sm text-sm leading-relaxed text-subtle">
          Agent is analyzing lecture concepts and assembling questions. This may take a moment.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-subtle">
        No quiz available for this lecture.
      </div>
    );
  }

  const resultMap = new Map(results?.results.map(r => [r.quiz_id, r]));

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-canvas">
      <div className="sticky top-0 z-10 border-b border-line bg-surface/80 p-5 backdrop-blur-sm">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Knowledge Check</h3>
        {results ? (
          <div className="pill mt-2 bg-positive/10 text-positive">
            Score {results.score} / {results.total}
          </div>
        ) : (
          <p className="mt-1 text-sm text-subtle">Test your understanding</p>
        )}
      </div>

      <div className="space-y-4 p-5">
        {questions.map((q, idx) => {
          const result = resultMap.get(q.id);
          const isAnswered = answers[q.id] !== undefined;

          return (
            <Card key={q.id} className="rounded-2xl border border-line bg-surface shadow-sm">
              <CardContent className="p-5">
                <p className="mb-4 flex gap-2.5 text-sm font-medium leading-relaxed text-ink">
                  <span className="font-mono text-faint">{String(idx + 1).padStart(2, "0")}</span>
                  <span>{q.question}</span>
                </p>
                <div className="space-y-2">
                  {q.choices.map((choice) => {
                    // Usually choices are "A. Something", extract letter
                    const letterMatch = choice.match(/^([A-D])[\.\)]?\s*(.*)/i);
                    const letter = letterMatch ? letterMatch[1].toUpperCase() : choice.charAt(0).toUpperCase();

                    const isSelected = answers[q.id] === letter;

                    let stateClass = "border-line bg-surface text-ink hover:bg-fill";
                    if (isSelected) {
                      stateClass = "border-accent bg-accent/5 text-accent";
                    }

                    if (result) {
                      if (isSelected && result.correct) {
                        stateClass = "border-positive bg-positive/10 text-positive";
                      } else if (isSelected && !result.correct) {
                        stateClass = "border-danger bg-danger/10 text-danger";
                      } else {
                        stateClass = "border-line bg-surface text-faint opacity-50";
                      }
                    }

                    return (
                      <button
                        key={choice}
                        onClick={() => handleSelect(q.id, letter)}
                        disabled={!!results}
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${stateClass}`}
                      >
                        <span className="mt-0.5 shrink-0 font-mono">
                          {result && isSelected ? (
                            result.correct ? <span className="text-positive">✓</span> : <span className="text-danger">✕</span>
                          ) : (
                            <span className={isSelected ? "text-accent" : "text-faint"}>{isSelected ? "●" : "○"}</span>
                          )}
                        </span>
                        <span>{choice}</span>
                      </button>
                    );
                  })}
                </div>

                {result && (
                  <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${result.correct ? 'border-positive bg-positive/10 text-positive' : 'border-danger bg-danger/10 text-danger'}`}>
                    <p className="mb-1 font-semibold">
                      {result.correct ? '✓ Correct' : '✕ Incorrect'}
                    </p>
                    <p className="leading-relaxed text-subtle">{result.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!results && (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="w-full"
          >
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
