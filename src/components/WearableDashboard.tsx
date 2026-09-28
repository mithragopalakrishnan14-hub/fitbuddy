import React, { useState } from 'react';
import { 
  Watch, 
  Heart, 
  Footprints, 
  Flame, 
  Moon, 
  Zap, 
  Battery, 
  RefreshCw, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Award, 
  CheckCircle2, 
  ShieldCheck,
  Clock
} from 'lucide-react';
import { WearableState, WorkoutLog } from '../types/fitness.js';

interface WearableDashboardProps {
  wearable: WearableState | null;
  workoutLogs: WorkoutLog[];
  onOpenWearableModal: () => void;
  onForceSync: () => Promise<void>;
  onStartDayOne: () => void;
}

export const WearableDashboard: React.FC<WearableDashboardProps> = ({
  wearable,
  workoutLogs,
  onOpenWearableModal,
  onForceSync,
  onStartDayOne,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await onForceSync();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const stepsGoal = wearable?.stepGoal || 10000;
  const stepsCurrent = wearable?.stepsToday || 8420;
  const stepsPct = Math.min(100, Math.round((stepsCurrent / stepsGoal) * 100));

  const calGoal = wearable?.calorieGoal || 650;
  const calCurrent = wearable?.activeCalories || 480;
  const calPct = Math.min(100, Math.round((calCurrent / calGoal) * 100));

  const recovery = wearable?.recoveryScore || 85;

  return (
    <div className="space-y-6">

      {/* Wearable Connection Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
            <Watch className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {wearable?.deviceName || 'Wearable Health Sync'}
              </h2>
              {wearable?.isConnected ? (
                <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-Time Connected</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                  Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synchronizing continuous HR, step cadence, sleep stages & autonomic recovery score
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>

          <button
            onClick={onOpenWearableModal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-md shadow-emerald-500/20"
          >
            Manage Device
          </button>
        </div>
      </div>

      {/* Activity Rings & Core Biometrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Step Count Gauge */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-teal-400 text-xs font-bold uppercase tracking-wider">
            <span>Daily Step Count</span>
            <Footprints className="w-4 h-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {stepsCurrent.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">/ {stepsGoal.toLocaleString()} steps</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${stepsPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{stepsPct}% of target</span>
            <span>~{(stepsCurrent * 0.00078).toFixed(1)} km walked</span>
          </div>
        </div>

        {/* Active Calories Burned */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>Active Calorie Burn</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">
              {calCurrent}
            </span>
            <span className="text-xs text-slate-400">/ {calGoal} kcal target</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${calPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{calPct}% of target</span>
            <span>Excess EPOC active</span>
          </div>
        </div>

        {/* Training Readiness / Recovery Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>Training Readiness</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {recovery}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Optimal Strain Readiness</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${recovery}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Nervous system primed. Recommended for full scheduled intensity.
          </p>
        </div>

      </div>

      {/* Advanced Biometrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Live HR */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold mb-1">
            <Heart className="w-4 h-4 fill-rose-500 animate-pulse" />
            <span>Resting HR</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{wearable?.restingHeartRate || 58}</span>
            <span className="text-xs text-slate-400">BPM</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Top 15% cardiovascular recovery</span>
        </div>

        {/* HRV */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-purple-400 text-xs font-semibold mb-1">
            <Activity className="w-4 h-4" />
            <span>HRV (rMSSD)</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{wearable?.hrvMs || 64}</span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Autonomic balance stable</span>
        </div>

        {/* Sleep Score */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-semibold mb-1">
            <Moon className="w-4 h-4" />
            <span>Sleep Duration</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{wearable?.sleepHours || 7.8}</span>
            <span className="text-xs text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Sleep Score: {wearable?.sleepScore || 88}/100</span>
        </div>

        {/* VO2 Max */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-semibold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>VO2 Max Est.</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{wearable?.vo2Max || 46.5}</span>
            <span className="text-[10px] text-slate-400">mL/kg/min</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Superior aerobic capacity</span>
        </div>
      </div>

      {/* Workout History Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Logged Workout Sessions</h3>
            <p className="text-xs text-slate-400">Biometric workout records saved in SQLite database</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {workoutLogs.length} Sessions Logged
          </span>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No completed workouts recorded yet. Start Day 1 to record your first session!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Workout Session</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Calories</th>
                  <th className="py-3 px-4">Avg HR</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workoutLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.dayTitle}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {Math.round(log.durationSeconds / 60)} min
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400 font-bold">
                      {log.caloriesBurned} kcal
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-400">
                      {log.avgHeartRate} BPM
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center space-x-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
