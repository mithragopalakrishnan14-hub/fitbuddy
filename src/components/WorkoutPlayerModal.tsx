import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Watch, 
  Heart, 
  Flame, 
  Clock, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Award,
  Plus,
  Info
} from 'lucide-react';
import { WorkoutDay, Exercise, WearableState } from '../types/fitness.js';
import { soundEffects } from '../utils/audio.js';

interface WorkoutPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: WorkoutDay;
  planId: string;
  wearable: WearableState | null;
  onWorkoutCompleted: (log: {
    planId: string;
    dayNumber: number;
    dayTitle: string;
    durationSeconds: number;
    caloriesBurned: number;
    avgHeartRate: number;
    maxHeartRate: number;
    completedExercisesCount: number;
    totalExercisesCount: number;
    notes: string;
  }) => Promise<void>;
}

export const WorkoutPlayerModal: React.FC<WorkoutPlayerModalProps> = ({
  isOpen,
  onClose,
  day,
  planId,
  wearable,
  onWorkoutCompleted,
}) => {
  if (!isOpen) return null;

  // Session timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Exercise tracking state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [exerciseProgress, setExerciseProgress] = useState<
    Record<string, { completedSets: boolean[]; weights: number[]; reps: number[] }>
  >(() => {
    const initial: Record<string, { completedSets: boolean[]; weights: number[]; reps: number[] }> = {};
    day.exercises.forEach((ex) => {
      const parsedReps = parseInt(ex.reps) || 10;
      initial[ex.id] = {
        completedSets: new Array(ex.sets).fill(false),
        weights: new Array(ex.sets).fill(20),
        reps: new Array(ex.sets).fill(parsedReps),
      };
    });
    return initial;
  });

  // Rest Timer state
  const [restTimeRemaining, setRestTimeRemaining] = useState<number | null>(null);
  const [totalRestTarget, setTotalRestTarget] = useState<number>(60);

  // Simulated live telemetry during workout
  const [sessionHeartRates, setSessionHeartRates] = useState<number[]>([120]);
  const [activeCaloriesBurned, setActiveCaloriesBurned] = useState<number>(10);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [finishedSummary, setFinishedSummary] = useState<any | null>(null);

  // Interval for elapsed time and active calorie burn
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          // Burn approx 6 to 10 calories per minute
          if (next % 6 === 0) {
            setActiveCaloriesBurned((c) => c + 1);
          }
          return next;
        });

        // Jitter live heart rate dynamically based on exercise intensity
        const base = 125 + Math.floor(Math.sin(Date.now() / 10000) * 20);
        const liveHr = Math.max(90, Math.min(178, base + Math.floor(Math.random() * 7) - 3));
        setSessionHeartRates((prev) => [...prev.slice(-30), liveHr]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Interval for countdown rest timer
  useEffect(() => {
    let restInterval: any = null;
    if (restTimeRemaining !== null && restTimeRemaining > 0) {
      restInterval = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 4 && prev > 1 && soundEnabled) {
            soundEffects.playCountdownBeep();
          }
          if (prev === 1) {
            if (soundEnabled) soundEffects.playGoBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimeRemaining === 0) {
      const timeout = setTimeout(() => setRestTimeRemaining(null), 1500);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(restInterval);
  }, [restTimeRemaining, soundEnabled]);

  const currentExercise = day.exercises[currentExerciseIndex] || day.exercises[0];
  const currentExState = exerciseProgress[currentExercise.id] || {
    completedSets: new Array(currentExercise.sets).fill(false),
    weights: new Array(currentExercise.sets).fill(20),
    reps: new Array(currentExercise.sets).fill(10),
  };

  const handleToggleSet = (setIndex: number) => {
    const updatedSets = [...currentExState.completedSets];
    const willBeCompleted = !updatedSets[setIndex];
    updatedSets[setIndex] = willBeCompleted;

    setExerciseProgress((prev) => ({
      ...prev,
      [currentExercise.id]: {
        ...currentExState,
        completedSets: updatedSets,
      },
    }));

    if (willBeCompleted) {
      if (soundEnabled) soundEffects.playSetComplete();
      // Start rest timer
      const restSec = currentExercise.restSeconds || 60;
      setTotalRestTarget(restSec);
      setRestTimeRemaining(restSec);
    }
  };

  const handleWeightChange = (setIndex: number, val: number) => {
    const newWeights = [...currentExState.weights];
    newWeights[setIndex] = Math.max(0, val);
    setExerciseProgress((prev) => ({
      ...prev,
      [currentExercise.id]: {
        ...currentExState,
        weights: newWeights,
      },
    }));
  };

  const handleRepsChange = (setIndex: number, val: number) => {
    const newReps = [...currentExState.reps];
    newReps[setIndex] = Math.max(1, val);
    setExerciseProgress((prev) => ({
      ...prev,
      [currentExercise.id]: {
        ...currentExState,
        reps: newReps,
      },
    }));
  };

  const currentLiveHR = sessionHeartRates[sessionHeartRates.length - 1] || 125;
  const avgHR = Math.round(
    sessionHeartRates.reduce((a, b) => a + b, 0) / Math.max(1, sessionHeartRates.length)
  );
  const maxHR = Math.max(...sessionHeartRates, 140);

  // Compute heart rate zone
  let hrZone = 'Zone 2 (Aerobic)';
  let hrColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (currentLiveHR < 115) {
    hrZone = 'Zone 1 (Warmup)';
    hrColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
  } else if (currentLiveHR < 138) {
    hrZone = 'Zone 2 (Fat Burn)';
    hrColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (currentLiveHR < 155) {
    hrZone = 'Zone 3 (Cardio)';
    hrColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (currentLiveHR < 170) {
    hrZone = 'Zone 4 (Threshold)';
    hrColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  } else {
    hrZone = 'Zone 5 (Peak Anaerobic)';
    hrColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  }

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Completion calculation
  const totalSetsCount = day.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSetsCount = Object.values(exerciseProgress).reduce(
    (acc, ex) => acc + ex.completedSets.filter(Boolean).length,
    0
  );
  const completionPercentage = Math.round((completedSetsCount / Math.max(1, totalSetsCount)) * 100);

  const handleFinishWorkout = async () => {
    setIsFinishing(true);
    const summary = {
      planId,
      dayNumber: day.dayNumber,
      dayTitle: day.title,
      durationSeconds: Math.max(60, elapsedSeconds),
      caloriesBurned: Math.max(25, activeCaloriesBurned),
      avgHeartRate: avgHR,
      maxHeartRate: maxHR,
      completedExercisesCount: day.exercises.filter((ex) =>
        exerciseProgress[ex.id]?.completedSets.every(Boolean)
      ).length,
      totalExercisesCount: day.exercises.length,
      notes: `Completed ${completedSetsCount}/${totalSetsCount} sets. Synced with ${wearable?.deviceName || 'Wearable'}.`,
    };

    await onWorkoutCompleted(summary);
    setFinishedSummary(summary);
    setIsFinishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Workout HUD Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                LIVE HUD TRACKER
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-white truncate max-w-xs">{day.title}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              title={soundEnabled ? 'Mute Audio Cues' : 'Unmute Audio Cues'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Finished Celebration Screen */}
        {finishedSummary ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-white">Workout Completed!</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Phenomenal effort. Your biometric session has been logged into SQLite and synced with your wearable health profile.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Duration</span>
                <span className="text-2xl font-mono font-bold text-white">{formatTime(finishedSummary.durationSeconds)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Calories</span>
                <span className="text-2xl font-mono font-bold text-amber-400">{finishedSummary.caloriesBurned} kcal</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Avg HR</span>
                <span className="text-2xl font-mono font-bold text-rose-400">{finishedSummary.avgHeartRate} BPM</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Completed</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {completedSetsCount}/{totalSetsCount}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
            >
              Return to Plan Studio
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* Live Wearable Biometric HUD Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Elapsed Timer */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Time</span>
                  <span className="text-xl font-mono font-bold text-white tracking-wider">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Live Heart Rate from Wearable */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <Heart className="w-5 h-5 fill-rose-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Wearable HR</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-mono font-bold text-white">{currentLiveHR}</span>
                    <span className="text-[11px] text-slate-400">BPM</span>
                  </div>
                </div>
              </div>

              {/* Heart Rate Zone */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Zone</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border inline-block mt-0.5 ${hrColor}`}>
                    {hrZone}
                  </span>
                </div>
              </div>

              {/* Active Calories Burned */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Burn</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-mono font-bold text-amber-400">{activeCaloriesBurned}</span>
                    <span className="text-[11px] text-slate-400">kcal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest Timer Countdown Overlay Card */}
            {restTimeRemaining !== null && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-mono font-extrabold text-2xl text-emerald-400">
                    {restTimeRemaining}s
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Rest Interval Active</h4>
                    <p className="text-xs text-slate-400">Breathe deeply through nose, lower heart rate for next set</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRestTimeRemaining((r) => (r !== null ? r + 30 : 30))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    +30s Rest
                  </button>
                  <button
                    onClick={() => setRestTimeRemaining(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition font-bold"
                  >
                    Skip Rest
                  </button>
                </div>
              </div>
            )}

            {/* Exercise Selector Carousel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Exercises ({currentExerciseIndex + 1} of {day.exercises.length})
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Total Progress: {completionPercentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {/* Exercise Navigation Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {day.exercises.map((ex, idx) => {
                  const isCurrent = idx === currentExerciseIndex;
                  const allDone = exerciseProgress[ex.id]?.completedSets.every(Boolean);
                  return (
                    <button
                      key={ex.id || idx}
                      onClick={() => setCurrentExerciseIndex(idx)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-2 shrink-0 transition ${
                        isCurrent
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : allDone
                          ? 'bg-slate-950 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {allDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-300">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate max-w-[120px]">{ex.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Exercise Set-Tracking Card */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Target: {currentExercise.targetMuscle}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                    {currentExercise.name}
                  </h3>
                  {currentExercise.formTips && (
                    <p className="text-xs text-slate-400 mt-1 flex items-start space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{currentExercise.formTips}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={currentExerciseIndex === 0}
                    onClick={() => setCurrentExerciseIndex((i) => Math.max(0, i - 1))}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    disabled={currentExerciseIndex === day.exercises.length - 1}
                    onClick={() => setCurrentExerciseIndex((i) => Math.min(day.exercises.length - 1, i + 1))}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Set Check-off Rows */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-4">Weight (kg/lbs)</div>
                  <div className="col-span-3">Reps</div>
                  <div className="col-span-3 text-right">Completed</div>
                </div>

                {currentExState.completedSets.map((isDone, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 items-center p-3 rounded-xl border transition ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="col-span-2 flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-mono font-bold flex items-center justify-center text-slate-300">
                        {sIdx + 1}
                      </span>
                    </div>

                    <div className="col-span-4 flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        value={currentExState.weights[sIdx] ?? 20}
                        onChange={(e) => handleWeightChange(sIdx, Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[11px] text-slate-400">kg</span>
                    </div>

                    <div className="col-span-3 flex items-center space-x-1">
                      <input
                        type="number"
                        min="1"
                        value={currentExState.reps[sIdx] ?? 10}
                        onChange={(e) => handleRepsChange(sIdx, Number(e.target.value))}
                        className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[11px] text-slate-400">reps</span>
                    </div>

                    <div className="col-span-3 text-right">
                      <button
                        onClick={() => handleToggleSet(sIdx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ml-auto ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </>
                        ) : (
                          <span>Mark Set</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* Footer with Finish Workout Button */}
        {!finishedSummary && (
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Watch className="w-4 h-4 text-emerald-400" />
              <span>{wearable?.deviceName || 'Wearable'} Active Syncing</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsActive(!isActive)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {isActive ? 'Pause Timer' : 'Resume Timer'}
              </button>

              <button
                onClick={handleFinishWorkout}
                disabled={isFinishing}
                className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-95 disabled:opacity-50"
              >
                {isFinishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Syncing Session...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finish & Save Workout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
