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

    return (
        <Card className={cn(
            "overflow-hidden backdrop-blur-sm border-2 py-3",
            isReceivables
                ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900",
            className
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        {isReceivables ? (
                            <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        )}
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/50 dark:bg-slate-950/50 border">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">
                            {isReceivables ? "To Receive" : "To Pay"}
                        </p>
                        <p className={cn(
                            "text-2xl font-bold mt-1",
                            isReceivables ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"
                        )}>
                            ₹{totalPending.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">
                            {isReceivables ? "Collected" : "Paid"}
                        </p>
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                            ₹{totalCompleted.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Breakdown Items */}
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className="block group"
                        >
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/70 dark:hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium flex items-center gap-2">
                                            {item.icon}
                                            {item.label}
                                        </p>
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Pending</p>
                                            <p className={cn(
                                                "text-sm font-semibold",
                                                isReceivables ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                                            )}>
                                                ₹{item.pending.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                {isReceivables ? "Collected" : "Paid"}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                ₹{item.completed.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
