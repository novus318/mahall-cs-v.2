import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        label: string;
    };
    className?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, className }: StatsCardProps) {
    return (
        <Card className={cn("overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-950/50", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {trend && (
                            <span className={cn(
                                "font-medium",
                                trend.value > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {trend.value > 0 ? "+" : ""}{trend.value}%
                            </span>
                        )}
                        <span>{trend && trend.label}</span>
                        <span>{description}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
