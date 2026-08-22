'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getIncomeExpenseReport, downloadIncomeExpenseReport } from '@/lib/api';
import { format } from 'date-fns';

export default function IncomeExpenseReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const result = await getIncomeExpenseReport(params);
            setData(result);
        } catch (error) {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const response = await downloadIncomeExpenseReport(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `income-expense-report-${startDate || 'all'}-to-${endDate || 'all'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report downloaded');
        } catch (error) {
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const totals = data?.totals || { income: 0, expense: 0, net: 0 };
    const dailySummary = data?.dailySummary || [];

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Finances · Reports
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Income & Expense Report</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Date-wise breakdown of all income and expense transactions.</p>
                </div>
                <Button size="sm" onClick={handleExport} disabled={exporting || loading}>
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export Excel
                </Button>
            </div>

            {/* Date Filters */}
            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                            <Input
                                type="date"
                                className="h-9 bg-background text-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">End Date</span>
                            <Input
                                type="date"
                                className="h-9 bg-background text-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                        >
                            Clear
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                                <TrendingUp className="h-5 w-5 text-chart-1" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Income</p>
                                <p className="text-xl font-bold text-chart-1">₹{totals.income.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                                <TrendingDown className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Expense</p>
                                <p className="text-xl font-bold text-destructive">₹{totals.expense.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", totals.net >= 0 ? "bg-chart-1/10" : "bg-destructive/10")}>
                                <Wallet className={cn("h-5 w-5", totals.net >= 0 ? "text-chart-1" : "text-destructive")} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Net</p>
                                <p className={cn("text-xl font-bold", totals.net >= 0 ? "text-chart-1" : "text-destructive")}>
                                    ₹{totals.net.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Breakdown Table */}
            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Daily Breakdown</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                            {loading ? 'Loading...' : `${dailySummary.length} day(s) with ${data?.transactionCount || 0} transactions`}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Income</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Expense</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Net</TableHead>
                                    <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Transactions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : dailySummary.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No transactions found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dailySummary.map((day: any) => {
                                        const net = day.income - day.expense;
                                        return (
                                            <TableRow key={day.date} className="hover:bg-muted/50">
                                                <TableCell className="font-medium text-sm">
                                                    {format(new Date(day.date), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm text-chart-1 font-bold">
                                                    {day.income > 0 ? `₹${day.income.toLocaleString()}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm text-destructive font-bold">
                                                    {day.expense > 0 ? `₹${day.expense.toLocaleString()}` : '-'}
                                                </TableCell>
                                                <TableCell className={cn("text-right font-mono text-sm font-bold", net >= 0 ? "text-chart-1" : "text-destructive")}>
                                                    {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-[10px] font-normal">
                                                        {day.transactions.length}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
