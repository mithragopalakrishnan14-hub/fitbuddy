import React, { useState } from 'react';
import { X, User, Save, Target, Flame, Dumbbell, Apple } from 'lucide-react';
import { UserProfile, FitnessGoal, WorkoutIntensity, ExperienceLevel, EquipmentType, DietaryPreference } from '../types/fitness.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSaveProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [age, setAge] = useState(user?.age || 28);
  const [weight, setWeight] = useState(user?.weight || 72.5);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(user?.weightUnit || 'kg');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(user?.fitnessGoal || 'muscle_gain');
  const [workoutIntensity, setWorkoutIntensity] = useState<WorkoutIntensity>(user?.workoutIntensity || 'medium');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(user?.experienceLevel || 'intermediate');
  const [equipment, setEquipment] = useState<EquipmentType>(user?.equipment || 'gym');
  const [daysPerWeek, setDaysPerWeek] = useState(user?.daysPerWeek || 4);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(user?.dietaryPreference || 'high_protein');
  const [injuriesOrNotes, setInjuriesOrNotes] = useState(user?.injuriesOrNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveProfile({
      name,
      age: Number(age),
      weight: Number(weight),
      weightUnit,
      fitnessGoal,
      workoutIntensity,
      experienceLevel,
      equipment,
      daysPerWeek: Number(daysPerWeek),
      dietaryPreference,
      injuriesOrNotes,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Athlete Profile & Settings</h2>
              <p className="text-xs text-slate-400">Stored persistently in SQLite database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Weight</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                  className="px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Dietary Preference</label>
              <select
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="high_protein">High-Protein</option>
                <option value="balanced">Balanced Whole Foods</option>
                <option value="plant_based">Plant-Based / Vegan</option>
                <option value="low_carb">Low-Carb / Paleo</option>
                <option value="keto">Ketogenic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Goal</label>
              <select
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value as FitnessGoal)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="wellness">General Wellness</option>
                <option value="endurance">Endurance</option>
                <option value="strength">Raw Strength</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Intensity</label>
              <select
                value={workoutIntensity}
                onChange={(e) => setWorkoutIntensity(e.target.value as WorkoutIntensity)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Equipment</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as EquipmentType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="gym">Full Gym</option>
                <option value="dumbbells">Dumbbells & Bands</option>
                <option value="bodyweight">Bodyweight Only</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Days / Week</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value={3}>3 Days</option>
                <option value={4}>4 Days</option>
                <option value={5}>5 Days</option>
                <option value={6}>6 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Notes / Injury History</label>
            <textarea
              rows={2}
              value={injuriesOrNotes}
              onChange={(e) => setInjuriesOrNotes(e.target.value)}
              placeholder="e.g. 'Lower back tightness, prefer dumbbell supported movements'"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
