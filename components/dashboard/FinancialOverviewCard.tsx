import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FinancialItem {
    label: string;
    pending: number;
    completed: number;
    count: number;
    href: string;
    icon?: React.ReactNode;
}

interface FinancialOverviewCardProps {
    title: string;
    type: "receivables" | "payables";
    totalPending: number;
    totalCompleted: number;
    items: FinancialItem[];
    className?: string;
}

export function FinancialOverviewCard({
    title,
    type,
    totalPending,
    totalCompleted,
    items,
    className
}: FinancialOverviewCardProps) {
    const isReceivables = type === "receivables";

    const accent = isReceivables ? {
        Icon: TrendingDown,
        chip: "bg-chart-1/10 text-chart-1",
        value: "text-chart-1",
    } : {
        Icon: TrendingUp,
        chip: "bg-chart-2/10 text-chart-2",
        value: "text-chart-2",
    };

    return (
        <Card className={cn("overflow-hidden bg-card py-3", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accent.chip)}>
                            <accent.Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end justify-between rounded-xl bg-muted/40 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">
                            {isReceivables ? "To Receive" : "To Pay"}
                        </p>
                        <p className={cn("mt-1 text-3xl font-bold tracking-tight", accent.value)}>
                            ₹{totalPending.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground">
                            {isReceivables ? "Collected" : "Paid"}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            ₹{totalCompleted.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    {items.map((item, index) => (
                        <Link key={index} href={item.href} className="group flex items-center justify-between py-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                    {item.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                                        {item.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isReceivables ? "collected" : "paid"} ₹{item.completed.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-foreground">
                                        ₹{item.pending.toLocaleString()}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
