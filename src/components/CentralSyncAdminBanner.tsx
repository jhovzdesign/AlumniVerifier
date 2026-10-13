import React from 'react';
import { useCentralSync } from '../context/SyncContext.tsx';
import { Cloud, Radio, RefreshCw, Smartphone, Laptop, CheckCircle2, ShieldCheck } from 'lucide-react';

export const CentralSyncAdminBanner: React.FC = () => {
  const { status, version, lastSyncTime, connectedDevices, isSyncing, syncNow, latestEvent } = useCentralSync();

  return (
    <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-900/40 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 shrink-0 mt-0.5">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wide">
                Centralized Cloud Database
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Real-Time Multi-Device Sync Active</span>
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
              One centralized database shared across all browsers, mobile devices, and authorized staff. Any alumnus added, edited, deleted, or status updated on any device is reflected immediately across all devices in real time without refreshing.
            </p>
          </div>
        </div>

        {/* Status Metrics & Force Sync */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{connectedDevices} device{connectedDevices !== 1 ? 's' : ''} connected</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              DB v{version} • {lastSyncTime ? `Synced ${lastSyncTime.toLocaleTimeString()}` : 'Live'}
            </span>
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={() => syncNow()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            title="Force instant sync with cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {latestEvent && latestEvent.action !== 'EXTERNAL_SYNC' && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200/90">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Latest Centralized Action:</span>
            <span className="truncate">{latestEvent.summary || latestEvent.action}</span>
          </div>
          <span className="font-mono text-stone-400 text-[10px] shrink-0 ml-2">
            {new Date(latestEvent.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
