import React from 'react';
import { X, History, Sparkles, CheckCircle2, ChevronRight, Calendar } from 'lucide-react';
import { WorkoutPlan } from '../types/fitness.js';

interface PlanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: WorkoutPlan[];
  activePlanId: string | undefined;
  onSelectPlan: (plan: WorkoutPlan) => void;
}

export const PlanHistoryModal: React.FC<PlanHistoryModalProps> = ({
  isOpen,
  onClose,
  plans,
  activePlanId,
  onSelectPlan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Plan Revisions & History</h2>
              <p className="text-xs text-slate-400">All routines and feedback iterations saved in SQLite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan List */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {plans.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">No workout plans saved yet.</p>
          ) : (
            plans.map((p) => {
              const isActive = p.id === activePlanId;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition ${
                    isActive
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-white">{p.title}</h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          v{p.version}.0
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.overview}</p>
                      
                      <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                        </span>
                        <span>•</span>
                        <span>{p.days.length} Days Schedule</span>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectPlan(p);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 transition shrink-0 ml-3"
                      >
                        Activate
                      </button>
                    )}
                  </div>

                  {/* Feedback History Timeline for this plan */}
                  {p.feedbackHistory && p.feedbackHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Feedback Iterations ({p.feedbackHistory.length}):
                      </span>
                      {p.feedbackHistory.map((item, idx) => (
                        <div key={idx} className="text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <div className="text-emerald-300 font-medium">💬 &ldquo;{item.feedback}&rdquo;</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">↳ {item.changesApplied}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
