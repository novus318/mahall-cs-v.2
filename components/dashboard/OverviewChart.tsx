'use client';

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface OverviewChartProps {
    data: any[];
}

export function OverviewChart({ data }: OverviewChartProps) {
    const formattedData = data || [];

    return (
        <Card className="col-span-4 bg-card py-3">
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                        <AreaChart data={formattedData}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', outline: 'none' }}
                                cursor={{ stroke: 'var(--color-muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="var(--color-chart-2)"
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                strokeWidth={2}
                                activeDot={{ r: 6, style: { fill: 'var(--color-chart-2)', opacity: 0.8 } }}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                name="Expense"
                                stroke="var(--color-chart-5)"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                strokeWidth={2}
                                activeDot={{ r: 6, style: { fill: 'var(--color-chart-5)', opacity: 0.8 } }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
