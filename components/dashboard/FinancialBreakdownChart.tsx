"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BreakdownData {
    name: string;
    value: number;
    color: string;
}

interface FinancialBreakdownChartProps {
    title: string;
    data: BreakdownData[];
}

export function FinancialBreakdownChart({ title, data }: FinancialBreakdownChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-950/50">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">₹{total.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}
