import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAddTransaction } from "../api/hooks";
import { useOfflineQueue } from "../offline/useOfflineQueue";
import type { TransactionEntryInput } from "../api/types";

export function TransactionForm({
  enterpriseId,
  onRecorded,
}: {
  enterpriseId: number | undefined;
  onRecorded: () => void;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<TransactionEntryInput["type"]>("income");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const addTransaction = useAddTransaction(enterpriseId);
  const { online, enqueue } = useOfflineQueue(enterpriseId, onRecorded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    const payload: TransactionEntryInput = { type, amount: numericAmount };

    if (online) {
      try {
        await addTransaction.mutateAsync(payload);
        setStatus(t("portal.recorded"));
      } catch {
        await enqueue(payload);
        setStatus(t("portal.savedOffline"));
      }
    } else {
      await enqueue(payload);
      setStatus(t("portal.savedOffline"));
    }
    setAmount("");
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{t("portal.type")}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionEntryInput["type"])}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="income">{t("portal.income")}</option>
          <option value="expense">{t("portal.expense")}</option>
          <option value="savings">{t("kpi.savings")}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{t("portal.amount")}</label>
        <input
          type="number"
          min="1"
          step="1"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-32"
          placeholder="5000"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
      >
        {t("portal.addEntry")}
      </button>
      {!online && <span className="text-xs text-amber-600">{t("portal.offlineHint")}</span>}
      {status && <span className="text-xs text-slate-500">{status}</span>}
    </form>
  );
}
