import React, { useState } from 'react';
import { 
  Apple, 
  Flame, 
  Droplet, 
  Moon, 
  Sparkles, 
  Send, 
  Clock, 
  Check, 
  Plus, 
  RotateCcw, 
  Zap, 
  Heart,
  ChevronRight,
  ShieldCheck,
  Coffee,
  Utensils
} from 'lucide-react';
import { NutritionPlan, UserProfile } from '../types/fitness.js';

interface NutritionViewProps {
  nutrition: NutritionPlan | null;
  user: UserProfile | null;
  onGenerateNutrition: () => Promise<void>;
  isGenerating: boolean;
  onAskCoach: (question: string) => Promise<string>;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  nutrition,
  user,
  onGenerateNutrition,
  isGenerating,
  onAskCoach,
}) => {
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ role: 'user' | 'coach'; text: string }>>([
    {
      role: 'coach',
      text: `Hello ${user?.name || 'Athlete'}! I'm your sports nutrition AI coach. Ask me anything about pre/post workout meals, hydration timing, or recovery supplements for your ${user?.fitnessGoal?.replace('_', ' ') || 'fitness'} goal.`,
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const [glassesLogged, setGlassesLogged] = useState(4); // 250ml each

  const handleSendQuestion = async () => {
    if (!question.trim() || isAsking) return;
    const q = question.trim();
    setQuestion('');
    setChatLog((prev) => [...prev, { role: 'user', text: q }]);
    setIsAsking(true);

    try {
      const answer = await onAskCoach(q);
      setChatLog((prev) => [...prev, { role: 'coach', text: answer }]);
    } catch (e) {
      setChatLog((prev) => [
        ...prev,
        { role: 'coach', text: 'Prioritize whole-food protein, consistent hydration, and balanced electrolytes.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  if (!nutrition) {
    return (
      <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Apple className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Personalized Nutrition & Recovery Guide</h3>
        <p className="text-sm text-slate-400 mb-6">
          Generate an evidence-based sports nutrition protocol aligned with your workout intensity and goal.
        </p>
        <button
          onClick={onGenerateNutrition}
          disabled={isGenerating}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {isGenerating ? 'Synthesizing Nutrition Protocol...' : 'Generate AI Nutrition Protocol'}
        </button>
      </div>
    );
  }

  const { macros } = nutrition;
  const currentLitersLogged = (glassesLogged * 0.25).toFixed(1);
  const hydrationPct = Math.min(100, Math.round((Number(currentLitersLogged) / nutrition.hydrationLiters) * 100));

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              {nutrition.goal.replace('_', ' ')} PROTOCOL
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
              Evidence-Based Macros
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Targeted Nutrition & Recovery Fuel
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {nutrition.generalTip}
          </p>
        </div>

        <button
          onClick={onGenerateNutrition}
          disabled={isGenerating}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0 self-start md:self-auto disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isGenerating ? 'Recalculating...' : 'Regenerate Protocol'}</span>
        </button>
      </div>

      {/* Caloric & Macronutrient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Calories */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase">
            <span>Daily Calorie Target</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-white">
              {nutrition.dailyCalories.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1">kcal / day</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Calibrated for your {user?.workoutIntensity || 'medium'} intensity training sessions.
          </p>
        </div>

        {/* Protein */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase">
            <span>Protein ({macros.proteinPercent}%)</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {macros.proteinGrams}g
            </span>
            <span className="text-xs text-slate-400 ml-1">daily</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${macros.proteinPercent}%` }} />
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-400 text-xs font-semibold uppercase">
            <span>Carbohydrates ({macros.carbsPercent}%)</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-teal-400">
              {macros.carbsGrams}g
            </span>
            <span className="text-xs text-slate-400 ml-1">daily</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${macros.carbsPercent}%` }} />
          </div>
        </div>

        {/* Healthy Fats */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400 text-xs font-semibold uppercase">
            <span>Healthy Fats ({macros.fatPercent}%)</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-extrabold font-mono text-purple-400">
              {macros.fatGrams}g
            </span>
            <span className="text-xs text-slate-400 ml-1">daily</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${macros.fatPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Pre/Post Workout Fuel & Hydration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Pre-Workout Timing */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <Coffee className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Pre-Workout Fueling</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {nutrition.preWorkoutTip}
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            💡 Prime glycogen stores 45-60 mins prior to ensure stamina during sets.
          </div>
        </div>

        {/* Post-Workout Recovery */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Post-Workout Anabolic Window</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {nutrition.postWorkoutTip}
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            💡 Maximize Muscle Protein Synthesis (MPS) within 45-90 mins post training.
          </div>
        </div>

        {/* Daily Hydration Logger */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-teal-400">
            <div className="flex items-center space-x-2">
              <Droplet className="w-5 h-5 fill-teal-400" />
              <h3 className="font-bold text-white text-sm">Hydration Goal</h3>
            </div>
            <span className="font-mono text-xs font-bold">{nutrition.hydrationLiters}L Target</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-white">{currentLitersLogged}L</span>
              <span className="text-xs text-slate-400 ml-1">logged ({glassesLogged} glasses)</span>
            </div>
            <button
              onClick={() => setGlassesLogged((g) => g + 1)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+250ml</span>
            </button>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${hydrationPct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Proper hydration prevents fatigue and supports cardiovascular output.
          </p>
        </div>

      </div>

      {/* Sample Meal Ideas */}
      {nutrition.sampleMealIdeas && nutrition.sampleMealIdeas.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Goal-Specific Sample Meal Breakdown</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Balanced nutrient distribution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nutrition.sampleMealIdeas.map((meal, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-white text-sm">{meal.meal}</h4>
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="text-amber-400">{meal.calories} kcal</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 font-semibold">{meal.protein}g protein</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{meal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep & Wearable Recovery Protocol */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-purple-400">
          <Moon className="w-5 h-5" />
          <h3 className="font-bold text-white text-base">Wearable Sleep & Autonomic Recovery Protocol</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {nutrition.recoveryProtocol}
        </p>
      </div>

      {/* Scenario 3: Ask AI Sports Nutrition Coach Micro-Chat */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Ask FitBuddy Nutrition Coach</h3>
            <p className="text-xs text-slate-400">
              Get immediate evidence-based nutritional recommendations tailored to your metabolic demands.
            </p>
          </div>
        </div>

        {/* Chat History Box */}
        <div className="space-y-3 max-h-60 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
          {chatLog.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Coach is formulating recommendation...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendQuestion();
            }}
            placeholder="e.g. 'What is the optimal carb-to-protein ratio after high intensity training?'"
            disabled={isAsking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
          />
          <button
            onClick={handleSendQuestion}
            disabled={!question.trim() || isAsking}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </div>
      </div>

    </div>
  );
};
