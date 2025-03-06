
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

const StatCard = ({ icon: Icon, label, value, change, className }: StatCardProps) => {
  return (
    <div className={cn("p-4 rounded-lg transition-all duration-300 hover:scale-105", className)}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-white/10 animate-pulse">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-white/80">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-white">{value}</p>
            {change && (
              <span
                className={cn(
                  "text-xs",
                  change.positive ? "text-green-300" : "text-red-300"
                )}
              >
                {change.positive ? "+" : "-"}
                {change.value}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
