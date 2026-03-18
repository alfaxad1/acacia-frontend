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
  iconColor = 'text-blue-600',
  trend,
  trendLabel,
  subtitle,
  progress
}: StatCardProps) {
  
  const isTrendPositive = trend && trend > 0;
  const trendDisplay = trend ? (trend > 0 ? `+${trend}` : trend) : null;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          
          <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {value}
          </p>
          
          {subtitle && (
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {trendDisplay && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                isTrendPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isTrendPositive ? (
                  <ArrowUpRight size={14} className="text-green-600" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-600" />
                )}
                <span>{trendDisplay}%</span>
              </div>
            )}
            
            {trendLabel && (
              <span className="text-[10px] text-gray-400">
                {trendLabel}
              </span>
            )}
          </div>

          {progress !== undefined && (
            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 ${iconColor} ml-2`}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
}