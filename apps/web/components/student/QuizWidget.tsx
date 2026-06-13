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
        <div className="h-6 bg-slate-800 rounded w-1/3 animate-pulse"></div>
        <div className="h-24 bg-slate-800 rounded w-full animate-pulse"></div>
        <div className="h-24 bg-slate-800 rounded w-full animate-pulse"></div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
        <p className="text-slate-300 font-medium">Generating Quiz...</p>
        <p className="text-sm text-slate-500">The AI is currently analyzing the lecture concepts and preparing questions. This may take a moment.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No quiz available for this lecture.
      </div>
    );
  }

  const resultMap = new Map(results?.results.map(r => [r.quiz_id, r]));

  return (
    <div className="flex flex-col h-full bg-[#0f1117] overflow-y-auto">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
        <h3 className="font-semibold text-slate-200">Knowledge Check</h3>
        {results ? (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
            Score: {results.score} / {results.total}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Test your understanding</p>
        )}
      </div>

      <div className="p-4 space-y-8">
        {questions.map((q, idx) => {
          const result = resultMap.get(q.id);
          const isAnswered = answers[q.id] !== undefined;
          
          return (
            <div key={q.id} className="space-y-4">
              <p className="font-medium text-slate-200 text-sm leading-relaxed">
                <span className="text-slate-500 mr-2">{idx + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.choices.map((choice) => {
                  // Usually choices are "A. Something", extract letter
                  const letterMatch = choice.match(/^([A-D])[\.\)]?\s*(.*)/i);
                  const letter = letterMatch ? letterMatch[1].toUpperCase() : choice.charAt(0).toUpperCase();
                  
                  const isSelected = answers[q.id] === letter;
                  
                  let stateClass = "border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-300";
                  if (isSelected) {
                    stateClass = "border-blue-500 bg-blue-500/10 text-blue-200";
                  }

                  if (result) {
                    if (isSelected && result.correct) {
                      stateClass = "border-emerald-500 bg-emerald-500/10 text-emerald-200";
                    } else if (isSelected && !result.correct) {
                      stateClass = "border-red-500 bg-red-500/10 text-red-200";
                    } else {
                      stateClass = "border-slate-800 bg-slate-900/30 text-slate-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleSelect(q.id, letter)}
                      disabled={!!results}
                      className={`w-full text-left p-3 rounded-lg border text-sm transition-colors flex items-start gap-3 ${stateClass}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {result && isSelected ? (
                          result.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-slate-600'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                        )}
                      </div>
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>
              
              {result && (
                <div className={`p-4 rounded-lg text-sm border ${result.correct ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-red-500/10 border-red-500/20 text-red-200'}`}>
                  <p className="font-semibold mb-1">{result.correct ? 'Correct!' : 'Incorrect'}</p>
                  <p className="opacity-90 leading-relaxed">{result.explanation}</p>
                </div>
              )}
            </div>
          );
        })}

        {!results && (
          <Button 
            onClick={handleSubmit} 
            disabled={Object.keys(answers).length < questions.length}
            className="w-full bg-blue-600 hover:bg-blue-500"
          >
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
