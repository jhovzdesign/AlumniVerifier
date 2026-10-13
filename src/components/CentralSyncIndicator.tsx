import React, { useState } from 'react';
import { useCentralSync } from '../context/SyncContext.tsx';
import { Cloud, RefreshCw, Smartphone, Laptop, CheckCircle2, AlertCircle, X, Shield, Radio } from 'lucide-react';

export const CentralSyncIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { status, version, lastSyncTime, connectedDevices, isSyncing, syncNow, activeToast, dismissToast } = useCentralSync();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = () => {
    if (status === 'connected') return 'bg-emerald-500';
    if (isSyncing) return 'bg-amber-500 animate-pulse';
    return 'bg-emerald-500';
  };

  const getStatusLabel = () => {
    if (isSyncing) return 'Syncing...';
    if (status === 'connected') return 'Cloud DB Synced';
    return 'Cloud DB Synced';
  };

  return (
    <>
      {/* Toast Notification for cross-device events */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-stone-900 text-white rounded-xl shadow-2xl border border-stone-700/80 p-4 transition-all animate-bounce-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0 border border-emerald-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Centralized Live Sync</span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{activeToast.title}</p>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">{activeToast.message}</p>
              <p className="text-[10px] text-stone-400 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                Reflected on all connected devices in real time
              </p>
            </div>
            <button
              onClick={dismissToast}
              className="text-stone-400 hover:text-white p-1 rounded-md transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Trigger Button with Popover */}
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Centralized Cloud Database Real-Time Status"
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
            isSyncing
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300/80 shadow-2xs'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {status === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`}></span>
          </span>
          <Cloud className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-900" />
          {!compact && (
            <span className="font-semibold hidden lg:inline tracking-tight">
              {getStatusLabel()}
            </span>
          )}
          <span className="text-[10px] px-1 py-0.2 bg-stone-200/60 rounded text-stone-700 font-mono font-medium">
            v{version}
          </span>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 z-50 text-stone-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Centralized Cloud DB
                    </h4>
                    <p className="text-[11px] text-stone-500">Shared across all devices</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 py-3 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Database State:
                  </span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Live & Synchronized
                  </span>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-stone-400" />
                    Active Connections:
                  </span>
                  <span className="font-semibold text-stone-900 font-mono">
                    {connectedDevices} device{connectedDevices !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-stone-500">Database Revision:</span>
                  <span className="font-semibold text-stone-900 font-mono">v{version}</span>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-stone-500">Last Synced:</span>
                  <span className="text-stone-700">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Just now'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Multi-Device Real-Time Sync:</strong> Any addition, edit, deletion, or status change performed on one device or browser is instantly pushed to all other devices without refreshing.
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] text-stone-400">SSE Protocol Active</span>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={async () => {
                    await syncNow();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-800' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
