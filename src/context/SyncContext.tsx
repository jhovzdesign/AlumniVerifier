import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { DBChangeEvent, SyncStatusResponse } from '../types/index.ts';
import { fetchSyncStatus } from '../utils/api.ts';

export type SyncConnectionStatus = 'connected' | 'connecting' | 'offline';

interface SyncContextType {
  status: SyncConnectionStatus;
  version: number;
  lastModified: string | null;
  lastSyncTime: Date | null;
  connectedDevices: number;
  latestEvent: DBChangeEvent | null;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  registerListener: (listener: (event: DBChangeEvent) => void) => () => void;
  dismissToast: () => void;
  activeToast: { title: string; message: string; timestamp: Date } | null;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start optimistically as connected since the centralized Express server is local/active
  const [status, setStatus] = useState<SyncConnectionStatus>('connected');
  const [version, setVersion] = useState<number>(1);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [connectedDevices, setConnectedDevices] = useState<number>(1);
  const [latestEvent, setLatestEvent] = useState<DBChangeEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<{ title: string; message: string; timestamp: Date } | null>(null);

  const listenersRef = useRef<Set<(event: DBChangeEvent) => void>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const versionRef = useRef<number>(version);
  versionRef.current = version;
  const failureCountRef = useRef<number>(0);

  const notifyListeners = useCallback((event: DBChangeEvent) => {
    listenersRef.current.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('[SyncContext] Listener execution error:', err);
      }
    });
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Poll server for latest database version and health
  const pollServerStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const res = await fetchSyncStatus();
      failureCountRef.current = 0;
      setStatus('connected');
      setConnectedDevices(Math.max(1, res.clientCount || 1));
      setLastSyncTime(new Date());

      if (res.version > versionRef.current) {
        setVersion(res.version);
        setLastModified(res.lastModified);
        notifyListeners({
          version: res.version,
          timestamp: res.lastModified,
          action: 'EXTERNAL_SYNC',
          entity: 'database',
          summary: 'Synchronized latest records from centralized cloud database'
        });
      } else if (isManual) {
        setVersion(res.version);
        setLastModified(res.lastModified);
        notifyListeners({
          version: res.version,
          timestamp: res.lastModified,
          action: 'EXTERNAL_SYNC',
          entity: 'database',
          summary: 'Manual synchronization with centralized cloud database'
        });
      }
    } catch (err) {
      console.warn('[SyncContext] Sync check warning:', err);
      failureCountRef.current += 1;
      // Only transition to offline after 3 consecutive HTTP poll failures
      if (failureCountRef.current >= 3) {
        setStatus('offline');
      }
    } finally {
      if (isManual) setIsSyncing(false);
    }
  }, [notifyListeners]);

  const manualSync = useCallback(async () => {
    await pollServerStatus(true);
  }, [pollServerStatus]);

  const registerListener = useCallback((listener: (event: DBChangeEvent) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    // 1. Immediate initial check
    pollServerStatus(false);

    // 2. Set up SSE connection (opportunistic push)
    const connectSSE = () => {
      if (isCancelled) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource('/api/sync/stream');
        eventSourceRef.current = es;

        es.addEventListener('init', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            failureCountRef.current = 0;
            setStatus('connected');
            setVersion(data.version || 1);
            setLastModified(data.lastModified || null);
            setConnectedDevices(Math.max(1, data.clientCount || 1));
            setLastSyncTime(new Date());
          } catch (err) {
            console.warn('[SyncContext] Parse init warning:', err);
          }
        });

        es.addEventListener('db_change', (e: MessageEvent) => {
          try {
            const event: DBChangeEvent = JSON.parse(e.data);
            failureCountRef.current = 0;
            setStatus('connected');
            setVersion(event.version);
            setLastModified(event.timestamp);
            setLastSyncTime(new Date());
            if (event.clientCount !== undefined) {
              setConnectedDevices(Math.max(1, event.clientCount));
            }
            setLatestEvent(event);

            const actionLabels: Record<string, string> = {
              CREATE_ALUMNI: 'New Alumni Registered',
              UPDATE_ALUMNI: 'Alumni Information Updated',
              DELETE_ALUMNI: 'Alumni Record Deleted',
              UPDATE_CARD_STATUS: 'Alumni Card Status Changed',
              UPDATE_UNIVERSITY: 'University Config Updated',
              UPDATE_CREDENTIALS: 'Admin Credentials Updated',
              RESET_CREDENTIALS: 'Admin Credentials Reset',
              VERIFY_QR: 'Live QR Code Verified',
              EXTERNAL_SYNC: 'Cloud Database Synced'
            };

            const title = actionLabels[event.action] || 'Centralized Database Updated';
            const msg = event.summary || 'Real-time multi-device sync update received from cloud database.';

            if (event.action !== 'VERIFY_QR') {
              setActiveToast({
                title,
                message: msg,
                timestamp: new Date()
              });

              setTimeout(() => {
                setActiveToast(current => (current?.title === title ? null : current));
              }, 4500);
            }

            notifyListeners(event);
          } catch (err) {
            console.warn('[SyncContext] Parse db_change warning:', err);
          }
        });

        es.onopen = () => {
          failureCountRef.current = 0;
          setStatus('connected');
        };

        es.onerror = () => {
          // Do NOT mark as offline immediately because HTTP polling is actively running and working!
          es.close();
          if (!isCancelled) {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = window.setTimeout(() => {
              connectSSE();
            }, 5000);
          }
        };
      } catch (e) {
        console.warn('[SyncContext] SSE initialization warning:', e);
      }
    };

    connectSSE();

    // 3. Fast, reliable HTTP polling interval (every 3 seconds) ensuring real-time multi-device sync works everywhere
    const pollInterval = window.setInterval(() => {
      pollServerStatus(false);
    }, 3000);

    // 4. Focus & visibility change handlers
    const handleVisibilityOrFocus = () => {
      pollServerStatus(false);
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isCancelled = true;
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [pollServerStatus, notifyListeners]);

  return (
    <SyncContext.Provider
      value={{
        status,
        version,
        lastModified,
        lastSyncTime,
        connectedDevices,
        latestEvent,
        isSyncing,
        syncNow: manualSync,
        registerListener,
        dismissToast,
        activeToast
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export function useCentralSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useCentralSync must be used within a SyncProvider');
  }
  return context;
}
