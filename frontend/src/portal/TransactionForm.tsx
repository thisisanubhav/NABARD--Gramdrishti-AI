import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAddTransaction } from "../api/hooks";
import { useOfflineQueue } from "../offline/useOfflineQueue";
import { Icon } from "../components/Icon";
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

  const inputClass =
    "h-touch-target rounded-lg border border-outline-variant px-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

  const typeOptions: { value: TransactionEntryInput["type"]; label: string }[] = [
    { value: "income", label: t("portal.income") },
    { value: "expense", label: t("portal.expense") },
    { value: "savings", label: t("kpi.savings") },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
      <div>
        <label className="block font-label-sm text-label-sm text-slate-muted mb-1.5">{t("portal.type")}</label>
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`h-touch-target px-4 rounded-full font-label-sm text-label-sm font-bold border transition-colors ${
                type === opt.value
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-stack-md">
        <div>
          <label className="block font-label-sm text-label-sm text-slate-muted mb-1">{t("portal.amount")}</label>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} w-32`}
            placeholder="5000"
          />
        </div>
        <button
          type="submit"
          className="h-touch-target rounded-lg bg-primary text-on-primary px-5 font-label-sm text-label-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-2"
        >
          <Icon name="add" size={18} />
          {t("portal.addEntry")}
        </button>
        {!online && (
          <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary">
            <Icon name="cloud_off" size={16} />
            {t("portal.offlineHint")}
          </span>
        )}
        {status && <span className="font-label-sm text-label-sm text-slate-muted">{status}</span>}
      </div>
    </form>
  );
}
