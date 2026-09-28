import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Dumbbell, 
  Flame, 
  Target, 
  Activity, 
  Zap, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { UserProfile, FitnessGoal, WorkoutIntensity, ExperienceLevel, EquipmentType } from '../types/fitness.js';

interface GeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onGeneratePlan: (user: UserProfile) => Promise<void>;
  isGenerating: boolean;
}

export const GeneratePlanModal: React.FC<GeneratePlanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGeneratePlan,
  isGenerating,
}) => {
  const [name, setName] = useState(currentUser?.name || 'Alex Morgan');
  const [age, setAge] = useState(currentUser?.age || 28);
  const [weight, setWeight] = useState(currentUser?.weight || 72);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(currentUser?.weightUnit || 'kg');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(currentUser?.fitnessGoal || 'muscle_gain');
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>(currentUser?.workoutIntensity || 'medium');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(currentUser?.experienceLevel || 'intermediate');
  const [equipment, setEquipment] = useState<EquipmentType>(currentUser?.equipment || 'gym');
  const [daysPerWeek, setDaysPerWeek] = useState(currentUser?.daysPerWeek || 4);
  const [injuriesOrNotes, setInjuriesOrNotes] = useState(currentUser?.injuriesOrNotes || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profile: UserProfile = {
      id: currentUser?.id || 'usr_default',
      name: name.trim() || 'Athlete',
      age: Number(age) || 28,
      weight: Number(weight) || 70,
      weightUnit,
      fitnessGoal,
      workoutIntensity,
      experienceLevel,
      equipment,
      daysPerWeek: Number(daysPerWeek) || 4,
      dietaryPreference: currentUser?.dietaryPreference || 'high_protein',
      injuriesOrNotes: injuriesOrNotes.trim(),
    };
    await onGeneratePlan(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Generate AI 7-Day Workout Routine</h2>
              <p className="text-xs text-slate-400">Gemini 3.8 Flash sports-science workout engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Personal Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Age</label>
              <input
                type="number"
                min="14"
                max="95"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Weight</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.5"
                  min="30"
                  max="300"
                  required
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                  className="px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fitness Goal */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Primary Fitness Goal</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'weight_loss', label: 'Weight Loss & Shred' },
                { id: 'muscle_gain', label: 'Muscle Gain (Hypertrophy)' },
                { id: 'wellness', label: 'General Wellness & Longevity' },
                { id: 'endurance', label: 'Endurance & Stamina' },
                { id: 'strength', label: 'Raw Strength & Power' },
              ].map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setFitnessGoal(g.id as FitnessGoal)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                    fitnessGoal === g.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Workout Intensity & Days Per Week */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Preferred Workout Intensity</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as WorkoutIntensity[]).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setWorkoutIntensity(lvl)}
                    className={`py-2 rounded-xl border text-xs font-bold uppercase transition ${
                      workoutIntensity === lvl
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Training Days / Week</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((days) => (
                  <button
                    type="button"
                    key={days}
                    onClick={() => setDaysPerWeek(days)}
                    className={`py-2 rounded-xl border text-xs font-bold font-mono transition ${
                      daysPerWeek === days
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Equipment & Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Available Equipment</span>
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as EquipmentType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="gym">Full Gym (Barbells, Cables & Machines)</option>
                <option value="dumbbells">Dumbbells & Resistance Bands (Home)</option>
                <option value="bodyweight">Bodyweight Only (Calisthenics)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Experience Level</span>
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="beginner">Beginner (&lt; 1 year training)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3+ years solid training)</option>
              </select>
            </div>
          </div>

          {/* Specific Focus / Injuries / Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Specific Considerations / Target Focus (Optional)
            </label>
            <input
              type="text"
              value={injuriesOrNotes}
              onChange={(e) => setInjuriesOrNotes(e.target.value)}
              placeholder="e.g. 'Slight shoulder impingement; prefer dumbbell floor press instead of barbell'"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing 7-Day Plan with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Generate Customized 7-Day Plan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
