import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, MinusCircle } from "lucide-react";

type Status = "verified" | "needs_info" | "unverified" | "closed" | "limited";

const CONFIG: Record<Status, { label: string; icon: any; className: string }> = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  needs_info: {
    label: "Needs Info",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  unverified: {
    label: "Unverified",
    icon: HelpCircle,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  limited: {
    label: "Limited",
    icon: MinusCircle,
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = (status as Status) || "unverified";
  const config = CONFIG[key] || CONFIG.unverified;
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
