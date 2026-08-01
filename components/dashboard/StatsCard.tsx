import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Tone = "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  "chart-1": "bg-chart-1/10 text-chart-1",
  "chart-2": "bg-chart-2/10 text-chart-2",
  "chart-3": "bg-chart-3/10 text-chart-3",
  "chart-4": "bg-chart-4/10 text-chart-4",
  "chart-5": "bg-chart-5/10 text-chart-5",
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  tone?: Tone;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  href?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "primary",
  trend,
  className,
  href,
}: StatsCardProps) {
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
            {href && (
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" />
            )}
          </div>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(description || trend) && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.value > 0 ? "text-chart-1" : "text-destructive"
              )}
            >
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
          )}
          <span>{trend && trend.label}</span>
          <span>{description}</span>
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        <Card className={cn(
          "overflow-hidden bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer",
          className
        )}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("overflow-hidden bg-card p-5", className)}>
      {cardContent}
    </Card>
  );
}
