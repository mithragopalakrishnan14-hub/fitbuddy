import React, { useState } from 'react';
import { 
  X, 
  Watch, 
  CheckCircle2, 
  RefreshCw, 
  Battery, 
  Heart, 
  Footprints, 
  Flame, 
  Moon, 
  Zap, 
  Radio, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { WearableState, WearableDeviceType } from '../types/fitness.js';

interface WearableModalProps {
  isOpen: boolean;
  onClose: () => void;
  wearable: WearableState | null;
  onUpdateWearable: (device: { deviceName: string; deviceType: WearableDeviceType; isConnected?: boolean }) => Promise<void>;
  onForceSync: () => Promise<void>;
}

const AVAILABLE_DEVICES: Array<{
  name: string;
  type: WearableDeviceType;
  brand: string;
  features: string;
}> = [
  {
    name: 'Apple Watch Ultra 2',
    type: 'apple_watch',
    brand: 'Apple',
    features: 'High precision dual-frequency GPS, ECG, HRV, VO2 Max, Live HR',
  },
  {
    name: 'Garmin Epix Pro (Gen 2)',
    type: 'garmin',
    brand: 'Garmin',
    features: 'Training Readiness, HRV Status, Multi-sport recovery analytics',
  },
  {
    name: 'Whoop 4.0 Strap',
    type: 'whoop',
    brand: 'Whoop',
    features: 'Strain score, Recovery index, Sleep staging, Skin temperature',
  },
  {
    name: 'Fitbit Charge 6',
    type: 'fitbit',
    brand: 'Fitbit / Google',
    features: 'Continuous HR, Daily Readiness, EDA stress management',
  },
  {
    name: 'Samsung Galaxy Watch 6',
    type: 'samsung',
    brand: 'Samsung',
    features: 'BioActive Sensor, Body composition BIA, Advanced sleep coaching',
  },
];

export const WearableModal: React.FC<WearableModalProps> = ({
  isOpen,
  onClose,
  wearable,
  onUpdateWearable,
  onForceSync,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedType, setSelectedType] = useState<WearableDeviceType>(wearable?.deviceType || 'apple_watch');
  const [scanMessage, setScanMessage] = useState('');

  if (!isOpen) return null;

  const handlePairDevice = async (device: (typeof AVAILABLE_DEVICES)[0]) => {
    setIsScanning(true);
    setScanMessage(`Scanning Bluetooth Low Energy (BLE) channels for ${device.name}...`);
    
    setTimeout(async () => {
      setScanMessage(`Establishing encrypted pairing with ${device.name}...`);
      setTimeout(async () => {
        await onUpdateWearable({
          deviceName: device.name,
          deviceType: device.type,
          isConnected: true,
        });
        setSelectedType(device.type);
        setIsScanning(false);
        setScanMessage('');
      }, 900);
    }, 1100);
  };

  const handleToggleConnection = async () => {
    if (!wearable) return;
    await onUpdateWearable({
      deviceName: wearable.deviceName,
      deviceType: wearable.deviceType,
      isConnected: !wearable.isConnected,
    });
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onForceSync();
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Wearable Device Manager</h2>
              <p className="text-xs text-slate-400">Pair & sync live biometric data with Apple Watch, Garmin & Fitbit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Current Device Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl border ${
                  wearable?.isConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  <Radio className={`w-6 h-6 ${wearable?.isConnected ? 'animate-pulse text-emerald-400' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-base">
                      {wearable?.deviceName || 'No Device Connected'}
                    </h3>
                    {wearable?.isConnected ? (
                      <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Connected</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Last sync: {wearable?.lastSyncedAt ? new Date(wearable.lastSyncedAt).toLocaleTimeString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Sync & Connect Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSyncClick}
                  disabled={!wearable?.isConnected || isSyncing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Sync</span>
                </button>

                <button
                  onClick={handleToggleConnection}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    wearable?.isConnected
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-transparent'
                  }`}
                >
                  {wearable?.isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>

            {/* Quick Live Stats if connected */}
            {wearable?.isConnected && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 text-rose-400 text-xs mb-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-400 animate-pulse" />
                    <span>Live HR</span>
                  </div>
                  <span className="font-mono font-bold text-white text-base">{wearable.liveHeartRate}</span>
                  <span className="text-[10px] text-slate-400 block">BPM</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 text-emerald-400 text-xs mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Recovery</span>
                  </div>
                  <span className="font-mono font-bold text-white text-base">{wearable.recoveryScore}%</span>
                  <span className="text-[10px] text-slate-400 block">Score</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 text-teal-400 text-xs mb-1">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Steps</span>
                  </div>
                  <span className="font-mono font-bold text-white text-base">{wearable.stepsToday.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">of 10k</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center space-x-1 text-amber-400 text-xs mb-1">
                    <Battery className="w-3.5 h-3.5" />
                    <span>Battery</span>
                  </div>
                  <span className="font-mono font-bold text-white text-base">{wearable.batteryLevel}%</span>
                  <span className="text-[10px] text-slate-400 block">Remaining</span>
                </div>
              </div>
            )}
          </div>

          {/* Pairing Scanning Animation */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Supported Wearable Devices List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Available Compatible Devices
              </h3>
              <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Apple Health & Health Connect Ready</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {AVAILABLE_DEVICES.map((device) => {
                const isCurrent = wearable?.deviceName === device.name && wearable?.isConnected;
                return (
                  <div
                    key={device.name}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${isCurrent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                        <Watch className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{device.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                            {device.brand}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{device.features}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePairDevice(device)}
                      disabled={isScanning}
                      className={`ml-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isCurrent ? 'Active Sync' : 'Pair Device'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy & Health Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-2.5 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              Wearable telemetry is synchronized locally and encrypted in SQLite. Heart rate zones and recovery scores automatically calibrate your daily workout intensity.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
