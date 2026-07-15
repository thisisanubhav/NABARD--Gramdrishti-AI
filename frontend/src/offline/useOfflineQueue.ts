import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { apiClient } from "../api/client";
import { offlineDb } from "./db";
import type { TransactionEntryInput } from "../api/types";

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

export function usePendingTransactions(enterpriseId: number | undefined) {
  return useLiveQuery(
    async () => {
      if (!enterpriseId) return [];
      return offlineDb.pendingTransactions.where({ enterpriseId }).toArray();
    },
    [enterpriseId],
    []
  );
}

export function useOfflineQueue(enterpriseId: number | undefined, onSynced: () => void) {
  const online = useOnlineStatus();

  const enqueue = useCallback(
    async (payload: TransactionEntryInput) => {
      if (!enterpriseId) return;
      await offlineDb.pendingTransactions.add({
        enterpriseId,
        payload,
        createdAt: new Date().toISOString(),
      });
    },
    [enterpriseId]
  );

  const flush = useCallback(async () => {
    if (!enterpriseId || !navigator.onLine) return;
    const pending = await offlineDb.pendingTransactions.where({ enterpriseId }).toArray();
    if (pending.length === 0) return;
    for (const item of pending) {
      try {
        await apiClient.post(`/enterprises/${item.enterpriseId}/transactions`, item.payload);
        await offlineDb.pendingTransactions.delete(item.id!);
      } catch {
        break; // stop on first failure (e.g. connection dropped mid-sync)
      }
    }
    onSynced();
  }, [enterpriseId, onSynced]);

  useEffect(() => {
    if (online) flush();
  }, [online, flush]);

  return { online, enqueue, flush };
}
