import { Link } from "react-router-dom";
import { Icon } from "./Icon";

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 font-label-sm text-label-sm text-slate-muted mb-2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <Icon name="chevron_right" size={14} />}
          {item.to ? (
            <Link to={item.to} className="hover:text-on-surface transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-primary font-bold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
