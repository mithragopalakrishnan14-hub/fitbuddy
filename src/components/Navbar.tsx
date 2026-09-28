import React from 'react';
import { 
  Flame, 
  Watch, 
  Dumbbell, 
  Apple, 
  Activity, 
  User, 
  Sparkles, 
  History,
  BatteryCharging,
  Wifi,
  WifiOff
} from 'lucide-react';
import { WearableState } from '../types/fitness.js';

interface NavbarProps {
  activeTab: 'plan' | 'tracker' | 'wearable' | 'nutrition';
  setActiveTab: (tab: 'plan' | 'tracker' | 'wearable' | 'nutrition') => void;
  wearable: WearableState | null;
  onOpenWearableModal: () => void;
  onOpenGenerateModal: () => void;
  onOpenProfileModal: () => void;
  onOpenHistoryModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wearable,
  onOpenWearableModal,
  onOpenGenerateModal,
  onOpenProfileModal,
  onOpenHistoryModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('plan')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">FitBuddy</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI COACH
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">Intelligent Workouts & Wearable Sync</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'plan'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>7-Day Routine</span>
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tracker'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Workout HUD</span>
            </button>

            <button
              onClick={() => setActiveTab('wearable')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'wearable'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Watch className="w-4 h-4" />
              <span>Wearable Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('nutrition')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'nutrition'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>Nutrition & Recovery</span>
            </button>
          </nav>

          {/* Right Action Tools: Wearable Status Pill & Modals */}
          <div className="flex items-center space-x-2.5">
            {/* Wearable Status Pill */}
            <button
              onClick={onOpenWearableModal}
              title="Configure Wearable Device"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 transition text-xs text-slate-300 group"
            >
              <div className="relative">
                <Watch className="w-4 h-4 text-emerald-400" />
                {wearable?.isConnected ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-slate-500" />
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-semibold text-slate-200">
                  {wearable?.isConnected ? wearable.deviceName : 'Device Disconnected'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {wearable?.isConnected ? `${wearable.liveHeartRate} BPM • ${wearable.batteryLevel}%` : 'Tap to pair'}
                </span>
              </div>
            </button>

            {/* Plan History */}
            <button
              onClick={onOpenHistoryModal}
              title="Plan Revisions & Version History"
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Profile Settings */}
            <button
              onClick={onOpenProfileModal}
              title="User Profile & Goals"
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <User className="w-4 h-4" />
            </button>

            {/* AI Generate New Plan Button */}
            <button
              onClick={onOpenGenerateModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 transition transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">New AI Plan</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-800/80 py-2 justify-around">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex flex-col items-center space-y-1 text-[11px] font-medium ${
              activeTab === 'plan' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>7-Day Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex flex-col items-center space-y-1 text-[11px] font-medium ${
              activeTab === 'tracker' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Workout</span>
          </button>
          <button
            onClick={() => setActiveTab('wearable')}
            className={`flex flex-col items-center space-y-1 text-[11px] font-medium ${
              activeTab === 'wearable' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Watch className="w-4 h-4" />
            <span>Wearables</span>
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex flex-col items-center space-y-1 text-[11px] font-medium ${
              activeTab === 'nutrition' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Nutrition</span>
          </button>
        </div>
      </div>
    </header>
  );
};
