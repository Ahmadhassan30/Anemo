"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

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
        <div className="h-6 w-1/3 animate-pulse rounded-sm border border-border bg-secondary"></div>
        <div className="h-24 w-full animate-pulse rounded-sm border border-border bg-secondary"></div>
        <div className="h-24 w-full animate-pulse rounded-sm border border-border bg-secondary"></div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="font-medium text-foreground">
          <span className="term-prompt text-primary" />generating_quiz
          <span className="term-cursor align-middle" aria-hidden />
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          // agent is analyzing lecture concepts and assembling questions — this may take a moment.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        <span className="text-primary">{"› "}</span>no_quiz_available for this lecture.
      </div>
    );
  }

  const resultMap = new Map(results?.results.map(r => [r.quiz_id, r]));

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 p-4 backdrop-blur-md">
        <h3 className="term-caret font-semibold tracking-wide text-foreground">knowledge_check</h3>
        {results ? (
          <div className="term-chip mt-2 text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            score: {results.score} / {results.total}
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">// test your understanding</p>
        )}
      </div>

      <div className="space-y-8 p-4">
        {questions.map((q, idx) => {
          const result = resultMap.get(q.id);
          const isAnswered = answers[q.id] !== undefined;

          return (
            <div key={q.id} className="space-y-4">
              <p className="text-sm font-medium leading-relaxed text-foreground">
                <span className="mr-2 text-primary">{String(idx + 1).padStart(2, "0")}{" //"}</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.choices.map((choice) => {
                  // Usually choices are "A. Something", extract letter
                  const letterMatch = choice.match(/^([A-D])[\.\)]?\s*(.*)/i);
                  const letter = letterMatch ? letterMatch[1].toUpperCase() : choice.charAt(0).toUpperCase();

                  const isSelected = answers[q.id] === letter;

                  let stateClass = "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground";
                  if (isSelected) {
                    stateClass = "border-primary bg-primary/10 text-foreground";
                  }

                  if (result) {
                    if (isSelected && result.correct) {
                      stateClass = "border-term-green bg-term-green/10 text-foreground";
                    } else if (isSelected && !result.correct) {
                      stateClass = "border-destructive bg-destructive/10 text-destructive";
                    } else {
                      stateClass = "border-border bg-card text-muted-foreground opacity-50";
                    }
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleSelect(q.id, letter)}
                      disabled={!!results}
                      className={`flex w-full items-start gap-3 rounded-sm border p-3 text-left text-sm transition-colors ${stateClass}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {result && isSelected ? (
                          result.correct ? <CheckCircle2 className="h-4 w-4 text-term-green" /> : <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'border-primary' : 'border-border'}`}>
                            {isSelected && <div className="h-2 w-2 rounded-sm bg-primary" />}
                          </div>
                        )}
                      </div>
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>

              {result && (
                <div className={`rounded-sm border p-4 text-sm ${result.correct ? 'border-term-green/30 bg-term-green/10 text-foreground' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                  <p className="mb-1 font-semibold">
                    <span className="text-primary">{"› "}</span>{result.correct ? 'correct' : 'incorrect'}
                  </p>
                  <p className="leading-relaxed opacity-90">{result.explanation}</p>
                </div>
              )}
            </div>
          );
        })}

        {!results && (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="term-btn term-btn-primary w-full"
          >
            $ submit_quiz
          </Button>
        )}
      </div>
    </div>
  );
}
