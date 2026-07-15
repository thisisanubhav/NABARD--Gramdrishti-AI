import Dexie, { type Table } from "dexie";
import type { TransactionEntryInput } from "../api/types";

export interface QueuedTransaction {
  id?: number;
  enterpriseId: number;
  payload: TransactionEntryInput;
  createdAt: string;
}

class OfflineDB extends Dexie {
  pendingTransactions!: Table<QueuedTransaction, number>;

  constructor() {
    super("nabard-offline");
    this.version(1).stores({
      pendingTransactions: "++id, enterpriseId, createdAt",
    });
  }
}

export const offlineDb = new OfflineDB();
