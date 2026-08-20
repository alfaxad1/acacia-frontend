import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  progress?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-brand-700",
  trend,
  trendLabel,
  subtitle,
  progress,
}: StatCardProps) {
  const isTrendPositive = trend !== undefined && trend > 0;
  const trendDisplay = trend ? (trend > 0 ? `+${trend}` : trend) : null;

  return (
    <div className="card card-pad transition-shadow duration-200 hover:shadow-lift">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            {title}
          </p>

          <p className="mt-1.5 truncate font-display text-xl font-bold text-gray-900 sm:text-2xl">
            {value}
          </p>

          {subtitle && <p className="mt-1 truncate text-xs text-gray-500">{subtitle}</p>}

          {(trendDisplay || trendLabel) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trendDisplay && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    isTrendPositive ? "text-brand-600" : "text-red-600"
                  }`}
                >
                  {isTrendPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {trendDisplay}%
                </span>
              )}
              {trendLabel && <span className="text-[10px] text-gray-400">{trendLabel}</span>}
            </div>
          )}

          {progress !== undefined && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className={`shrink-0 rounded-2xl bg-brand-50 p-2.5 sm:p-3 ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
