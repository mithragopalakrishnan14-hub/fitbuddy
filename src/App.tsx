import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { WorkoutPlanView } from './components/WorkoutPlanView.js';
import { WorkoutPlayerModal } from './components/WorkoutPlayerModal.js';
import { WearableModal } from './components/WearableModal.js';
import { GeneratePlanModal } from './components/GeneratePlanModal.js';
import { NutritionView } from './components/NutritionView.js';
import { WearableDashboard } from './components/WearableDashboard.js';
import { PlanHistoryModal } from './components/PlanHistoryModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { 
  UserProfile, 
  WorkoutPlan, 
  NutritionPlan, 
  WearableState, 
  WorkoutLog, 
  WorkoutDay, 
  WearableDeviceType 
} from './types/fitness.js';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'plan' | 'tracker' | 'wearable' | 'nutrition'>('plan');
  
  // App data state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [allPlans, setAllPlans] = useState<WorkoutPlan[]>([]);
  const [nutrition, setNutrition] = useState<NutritionPlan | null>(null);
  const [wearable, setWearable] = useState<WearableState | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // Modals state
  const [isWearableModalOpen, setIsWearableModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<WorkoutDay | null>(null);

  // Loading & status states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingNutrition, setIsGeneratingNutrition] = useState(false);
  const [lastChangesApplied, setLastChangesApplied] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial data loading
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [userRes, planRes, plansRes, nutrRes, wearRes, logsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/plans/active'),
          fetch('/api/plans'),
          fetch('/api/nutrition/latest'),
          fetch('/api/wearable/state'),
          fetch('/api/workouts/history'),
        ]);

        if (userRes.ok) setUser(await userRes.json());
        if (planRes.ok) setActivePlan(await planRes.json());
        if (plansRes.ok) setAllPlans(await plansRes.json());
        if (nutrRes.ok) setNutrition(await nutrRes.json());
        if (wearRes.ok) setWearable(await wearRes.json());
        if (logsRes.ok) setWorkoutLogs(await logsRes.json());
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Periodic polling for wearable live heart rate telemetry
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/wearable/state');
        if (res.ok) {
          const data = await res.json();
          setWearable(data);
        }
      } catch (e) {
        // quiet error
      }
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleUpdateWearable = async (device: {
    deviceName: string;
    deviceType: WearableDeviceType;
    isConnected?: boolean;
  }) => {
    try {
      const res = await fetch('/api/wearable/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device),
      });
      if (res.ok) {
        const stateRes = await fetch('/api/wearable/state');
        if (stateRes.ok) setWearable(await stateRes.json());
        showToast(`Wearable updated: ${device.deviceName}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceSync = async () => {
    try {
      const res = await fetch('/api/wearable/sync', { method: 'POST' });
      if (res.ok) {
        const stateRes = await fetch('/api/wearable/state');
        if (stateRes.ok) setWearable(await stateRes.json());
        showToast('Wearable metrics synchronized successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Scenario 1: Generate Plan with AI
  const handleGeneratePlan = async (profile: UserProfile) => {
    setIsGeneratingPlan(true);
    try {
      // Save profile updates
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setUser(profile);

      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: profile }),
      });

      if (res.ok) {
        const data = await res.json();
        setActivePlan(data.plan);
        setAllPlans((prev) => [data.plan, ...prev]);
        setIsGenerateModalOpen(false);
        setLastChangesApplied(null);
        showToast('Personalized 7-day workout plan generated!');
      }
    } catch (e) {
      console.error(e);
      showToast('Error generating plan');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Scenario 2: Dynamic Feedback Refinement
  const handleRefinePlan = async (feedback: string) => {
    if (!activePlan) return;
    setIsRefining(true);
    try {
      const res = await fetch(`/api/plans/${activePlan.id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });

      if (res.ok) {
        const data = await res.json();
        setActivePlan(data.plan);
        setAllPlans((prev) => prev.map((p) => (p.id === data.plan.id ? data.plan : p)));
        setLastChangesApplied(data.changesApplied);
        showToast(`Plan refined (v${data.plan.version}.0)`);
      }
    } catch (e) {
      console.error(e);
      showToast('Error refining plan');
    } finally {
      setIsRefining(false);
    }
  };

  // Scenario 3: Nutrition & Recovery Generation
  const handleGenerateNutrition = async () => {
    setIsGeneratingNutrition(true);
    try {
      const res = await fetch('/api/nutrition/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
      if (res.ok) {
        const data = await res.json();
        setNutrition(data.nutrition);
        showToast('Nutrition & recovery protocol synthesized!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingNutrition(false);
    }
  };

  const handleAskCoach = async (question: string): Promise<string> => {
    try {
      const res = await fetch('/api/nutrition/ask-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.answer;
      }
      return 'Prioritize lean protein, whole foods, and ample water.';
    } catch (e) {
      return 'Stay hydrated and consume protein within 60 minutes of training.';
    }
  };

  // Workout Completion Logger
  const handleWorkoutCompleted = async (logData: any) => {
    try {
      const res = await fetch('/api/workouts/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
      if (res.ok) {
        const logsRes = await fetch('/api/workouts/history');
        if (logsRes.ok) setWorkoutLogs(await logsRes.json());
        const wearRes = await fetch('/api/wearable/state');
        if (wearRes.ok) setWearable(await wearRes.json());
        showToast('Workout session recorded in SQLite!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (partial: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showToast('Athlete profile updated in SQLite');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight text-white">Initializing FitBuddy</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting SQLite database & Wearable telemetry engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wearable={wearable}
        onOpenWearableModal={() => setIsWearableModalOpen(true)}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: 7-Day Routine Studio */}
        {activeTab === 'plan' && (
          <WorkoutPlanView
            plan={activePlan}
            onStartWorkout={(day) => setActiveWorkoutDay(day)}
            onRefinePlan={handleRefinePlan}
            isRefining={isRefining}
            onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
            lastChangesApplied={lastChangesApplied}
          />
        )}

        {/* Tab 2: Workout HUD & Active Player */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  INTERACTIVE WORKOUT PLAYER
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Active Session & Wearable HUD
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select any day from your routine to launch the interactive set counter, audio rest timer, and live heart rate monitor.
                </p>
              </div>

              {activePlan?.days && activePlan.days[0] && (
                <button
                  onClick={() => setActiveWorkoutDay(activePlan.days.find((d) => !d.isRestDay) || activePlan.days[0])}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 shrink-0"
                >
                  Launch Day 1 Session
                </button>
              )}
            </div>

            {/* Quick launch grid for each day */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePlan?.days.map((day) => (
                <div
                  key={day.dayNumber}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">{day.dayName}</span>
                      {day.isRestDay ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                          Rest Day
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          {day.exercises.length} Exercises
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base mb-1">{day.title}</h3>
                    <p className="text-xs text-slate-400">
                      {day.estimatedMinutes}m • {day.estimatedCalories} kcal • {day.targetHeartRateZone}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {!day.isRestDay ? (
                      <button
                        onClick={() => setActiveWorkoutDay(day)}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                      >
                        <span>Start Session</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 block text-center py-1">
                        Active recovery & stretching
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Wearable & Health Telemetry Hub */}
        {activeTab === 'wearable' && (
          <WearableDashboard
            wearable={wearable}
            workoutLogs={workoutLogs}
            onOpenWearableModal={() => setIsWearableModalOpen(true)}
            onForceSync={handleForceSync}
            onStartDayOne={() => {
              if (activePlan?.days && activePlan.days[0]) {
                setActiveWorkoutDay(activePlan.days[0]);
              }
            }}
          />
        )}

        {/* Tab 4: Nutrition & Recovery Coach */}
        {activeTab === 'nutrition' && (
          <NutritionView
            nutrition={nutrition}
            user={user}
            onGenerateNutrition={handleGenerateNutrition}
            isGenerating={isGeneratingNutrition}
            onAskCoach={handleAskCoach}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">FitBuddy AI Fitness Engine</span>
            <span>•</span>
            <span>Powered by Google Gemini 3.8 Flash</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>SQLite Embedded Database</span>
            <span>•</span>
            <span>Wearable BLE Sync Engine</span>
            <span>•</span>
            <span>Sports Science Telemetry</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Active Workout Player Modal */}
      {activeWorkoutDay && activePlan && (
        <WorkoutPlayerModal
          isOpen={!!activeWorkoutDay}
          onClose={() => setActiveWorkoutDay(null)}
          day={activeWorkoutDay}
          planId={activePlan.id}
          wearable={wearable}
          onWorkoutCompleted={handleWorkoutCompleted}
        />
      )}

      {/* Wearable Configuration Modal */}
      <WearableModal
        isOpen={isWearableModalOpen}
        onClose={() => setIsWearableModalOpen(false)}
        wearable={wearable}
        onUpdateWearable={handleUpdateWearable}
        onForceSync={handleForceSync}
      />

      {/* Generate AI Plan Modal (Scenario 1) */}
      <GeneratePlanModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        currentUser={user}
        onGeneratePlan={handleGeneratePlan}
        isGenerating={isGeneratingPlan}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSaveProfile={handleSaveProfile}
      />

      {/* Plan History Modal */}
      <PlanHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        plans={allPlans}
        activePlanId={activePlan?.id}
        onSelectPlan={(p) => setActivePlan(p)}
      />

    </div>
  );
}
