import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
    href?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, className, href }: StatsCardProps) {
    const cardContent = (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{value}</div>
                    {href && (
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </div>
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
        </>
    );

    if (href) {
        return (
            <Link href={href} className="block group">
                <Card className={cn(
                    "overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-950/50 transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer",
                    className
                )}>
                    {cardContent}
                </Card>
            </Link>
        );
    }

    return (
        <Card className={cn("overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-950/50", className)}>
            {cardContent}
        </Card>
    );
}
