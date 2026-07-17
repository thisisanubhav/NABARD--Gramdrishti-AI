import type { Recommendation } from "../api/types";
import { Icon } from "./Icon";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-stack-md flex gap-3 items-start">
      <span className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon name="lightbulb" filled size={18} />
      </span>
      <div>
        <p className="font-label-sm text-label-sm text-on-surface font-bold">{recommendation.title}</p>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed text-sm">
          {recommendation.detail}
        </p>
      </div>
    </div>
  );
}
