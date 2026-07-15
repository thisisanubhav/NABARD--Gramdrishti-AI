import type { Recommendation } from "../api/types";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">{recommendation.title}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{recommendation.detail}</p>
    </div>
  );
}
