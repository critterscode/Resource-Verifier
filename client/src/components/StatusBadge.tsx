import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

type Status = "verified" | "missing_info" | "unverified";

const CONFIG = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  missing_info: {
    label: "Missing Info",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  unverified: {
    label: "Unverified",
    icon: HelpCircle,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = (status as Status) || "unverified";
  const config = CONFIG[key];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm",
      config.className,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
