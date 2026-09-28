import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  RotateCcw, 
  Clock, 
  Flame, 
  Activity, 
  CheckCircle, 
  HelpCircle, 
  ChevronRight, 
  Sliders, 
  Send, 
  Layers, 
  Heart,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { WorkoutPlan, WorkoutDay, Exercise } from '../types/fitness.js';

interface WorkoutPlanViewProps {
  plan: WorkoutPlan | null;
  onStartWorkout: (day: WorkoutDay) => void;
  onRefinePlan: (feedback: string) => Promise<void>;
  isRefining: boolean;
  onOpenGenerateModal: () => void;
  lastChangesApplied?: string | null;
}

const QUICK_FEEDBACK_PROMPTS = [
  'More focus on cardio and calorie burn',
  'Include an extra rest day for recovery',
  'Swap squats and lunges due to knee sensitivity',
  'Keep all sessions under 35 minutes',
  'Focus more on back and shoulder posture',
  'Reduce heavy joint loading, more bodyweight/bands'
];

export const WorkoutPlanView: React.FC<WorkoutPlanViewProps> = ({
  plan,
  onStartWorkout,
  onRefinePlan,
  isRefining,
  onOpenGenerateModal,
  lastChangesApplied,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [showRefinePanel, setShowRefinePanel] = useState<boolean>(false);

  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Workout Routine Found</h3>
        <p className="text-sm text-slate-400 mb-6">
          Generate an intelligent 7-day fitness routine customized with Gemini AI to match your goals.
        </p>
        <button
          onClick={onOpenGenerateModal}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
        >
          Generate Personalized 7-Day Plan
        </button>
      </div>
    );
  }

  const selectedDay = plan.days.find((d) => d.dayNumber === selectedDayNumber) || plan.days[0];

  const handleSendFeedback = async (text: string) => {
    if (!text.trim() || isRefining) return;
    await onRefinePlan(text.trim());
    setCustomFeedback('');
  };

  return (
    <div className="space-y-6">

      {/* Plan Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {plan.goal.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {plan.intensity.toUpperCase()} INTENSITY
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                v{plan.version}.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {plan.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {plan.overview}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowRefinePanel(!showRefinePanel)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                showRefinePanel
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Refine with AI</span>
            </button>

            <button
              onClick={onOpenGenerateModal}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Generate a completely new plan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Plan</span>
            </button>
          </div>
        </div>

        {/* Weekly Focus callout */}
        <div className="mt-4 pt-4 border-t border-slate-800/70 flex items-start space-x-2.5 text-xs text-slate-300">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Weekly Training Focus: </span>
            <span className="text-slate-400">{plan.weeklyFocus}</span>
          </div>
        </div>
      </div>

      {/* AI Changes Applied Notification Banner */}
      {lastChangesApplied && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-sm text-emerald-200 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-white">AI Plan Refined (v{plan.version}.0): </span>
            <span>{lastChangesApplied}</span>
          </div>
        </div>
      )}

      {/* Scenario 2: Interactive AI Feedback Refinement Panel */}
      {showRefinePanel && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dynamic AI Plan Refinement</h3>
                <p className="text-xs text-slate-400">
                  Tell FitBuddy what to adjust. Gemini will regenerate the schedule while preserving your primary goal.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRefinePanel(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_FEEDBACK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendFeedback(prompt)}
                  disabled={isRefining}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950/80 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/30 transition disabled:opacity-50 text-left"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Text Prompt Input */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="e.g., 'Swap barbell squats for dumbbell Bulgarian split squats due to lower back tightness'..."
              disabled={isRefining}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendFeedback(customFeedback);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-white placeholder-slate-500 focus:outline-none transition"
            />
            <button
              onClick={() => handleSendFeedback(customFeedback)}
              disabled={!customFeedback.trim() || isRefining}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 shrink-0"
            >
              {isRefining ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Refining...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Update Routine</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 7-Day Horizontal Selector Tabs */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
        {plan.days.map((day) => {
          const isSelected = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-w-[100px] ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold">{day.dayName}</span>
                {day.isRestDay ? (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Rest
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold truncate block">
                {day.title}
              </span>
              <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                <span>{day.estimatedMinutes}m</span>
                <span>•</span>
                <span>{day.estimatedCalories} kcal</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Detailed Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        
        {/* Day Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                {selectedDay.dayName} • {selectedDay.isRestDay ? 'RECOVERY DAY' : 'TRAINING SESSION'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {selectedDay.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedDay.estimatedMinutes} Minutes</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>~{selectedDay.estimatedCalories} Calories</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>{selectedDay.targetHeartRateZone}</span>
              </span>
            </div>
          </div>

          {/* Start Workout Button */}
          {!selectedDay.isRestDay ? (
            <button
              onClick={() => onStartWorkout(selectedDay)}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95 shrink-0"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Workout HUD</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Active Recovery Day</span>
            </div>
          )}
        </div>

        {/* Warm-Up Section */}
        {selectedDay.warmup && selectedDay.warmup.instructions.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Dynamic Warm-Up ({selectedDay.warmup.durationMinutes} Minutes)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Prime joints & elevate core temp</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {selectedDay.warmup.instructions.map((inst, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-300 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exercises List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Exercises ({selectedDay.exercises.length})
            </h3>
            <span className="text-xs text-emerald-400">
              Interactive set tracking available in Live Workout mode
            </span>
          </div>

          <div className="space-y-3">
            {selectedDay.exercises.map((exercise, idx) => (
              <div
                key={exercise.id || idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-base">{exercise.name}</h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {exercise.targetMuscle}
                      </span>
                    </div>
                    {exercise.formTips && (
                      <p className="text-xs text-slate-400 mt-1 flex items-start space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{exercise.formTips}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block">Sets</span>
                    <span className="font-mono font-bold text-white text-sm">{exercise.sets}</span>
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block">Reps</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{exercise.reps}</span>
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block">Rest</span>
                    <span className="font-mono font-bold text-teal-400 text-sm">{exercise.restSeconds}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cooldown & Recovery Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {selectedDay.cooldown && selectedDay.cooldown.instructions.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span>Cooldown ({selectedDay.cooldown.durationMinutes}m)</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {selectedDay.cooldown.instructions.map((c, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedDay.recoveryTip && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center space-x-2">
                <Heart className="w-3.5 h-3.5" />
                <span>Wearable Recovery Tip</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedDay.recoveryTip}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
