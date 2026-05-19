/**
 * /learn — interactive modules (quiz, checklist, guess split, info). Completion + streak.
 */
import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StreakBadge } from '../../components/StreakBadge';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import { learnModules } from '../data/learnModules';
import type { LearnModule } from '../types/domain';
import { CheckCircle, Circle } from 'lucide-react';

export function LearnPage() {
  const { state, completeLearnModule } = useUser();
  const { requireAuth } = useGuestGate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [checklistDone, setChecklistDone] = useState<Record<string, Set<number>>>({});

  const completed = state?.activity?.learnCompletions ?? [];
  const streak = state?.activity?.streakCount ?? 0;
  const selected = learnModules.find((m) => m.id === selectedId);

  const handleQuizSubmit = (moduleId: string, stepIndex: number, chosenIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [`${moduleId}-${stepIndex}`]: chosenIndex }));
    const mod = learnModules.find((m) => m.id === moduleId);
    const step = mod?.steps?.[stepIndex];
    if (step && 'correctIndex' in step && step.correctIndex === chosenIndex) {
      if (stepIndex === (mod.steps?.length ?? 0) - 1) requireAuth(() => completeLearnModule(moduleId));
    }
  };

  const handleChecklistToggle = (moduleId: string, index: number) => {
    setChecklistDone((prev) => {
      const set = new Set(prev[moduleId] ?? []);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      const next = { ...prev, [moduleId]: set };
      const mod = learnModules.find((m) => m.id === moduleId);
      if (mod?.steps && set.size === mod.steps.length) requireAuth(() => completeLearnModule(moduleId));
      return next;
    });
  };

  const handleCompleteInfo = (moduleId: string) => {
    requireAuth(() => { completeLearnModule(moduleId); setSelectedId(null); });
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Learn</h1>
          <p className="text-slate-400 text-sm">Quick modules on rules, strategy, and splits.</p>
        </div>
        <StreakBadge count={streak} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {learnModules.map((m) => (
          <Card
            key={m.id}
            animate={false}
            className={`cursor-pointer hover:border-cyan-500/30 transition-colors ${selectedId === m.id ? 'border-cyan-500/50' : ''}`}
            onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              {completed.includes(m.id) ? (
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-slate-500 shrink-0" />
              )}
              <div className="min-w-0">
                <h3 className="font-medium text-white">{m.title}</h3>
                <p className="text-xs text-slate-500 truncate">{m.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {selected && (
        <Card animate={false} className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-2">{selected.title}</h2>
            <p className="text-slate-400 text-sm mb-6">{selected.description}</p>
            {selected.type === 'quiz' && selected.steps?.length && (
              <div className="space-y-4">
                {selected.steps.map((step, i) => (
                  <div key={i}>
                    <p className="text-white font-medium mb-2">{step.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.options?.map((opt, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => handleQuizSubmit(selected.id, i, j)}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            quizAnswers[`${selected.id}-${i}`] === j
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                              : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quizAnswers[`${selected.id}-${i}`] !== undefined && step.correctIndex !== undefined && (
                      <p className={`text-sm mt-2 ${quizAnswers[`${selected.id}-${i}`] === step.correctIndex ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {quizAnswers[`${selected.id}-${i}`] === step.correctIndex ? 'Correct!' : 'Not quite. Try again next time.'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {selected.type === 'checklist' && selected.steps?.length && (
              <div className="space-y-2">
                {selected.steps.map((step, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(checklistDone[selected.id] ?? new Set()).has(i)}
                      onChange={() => handleChecklistToggle(selected.id, i)}
                      className="rounded border-slate-600 text-cyan-500"
                    />
                    <span className="text-slate-300">{step.content}</span>
                  </label>
                ))}
              </div>
            )}
            {(selected.type === 'guess_split' || selected.type === 'info') && selected.steps?.length && (
              <div className="space-y-4">
                {selected.steps.map((step, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-slate-300 text-sm">{step.content}</p>
                    {step.options && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step.options.map((opt, j) => (
                          <button
                            key={j}
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-400"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleCompleteInfo(selected.id)}
                  className="mt-4 px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium"
                >
                  Mark complete
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
