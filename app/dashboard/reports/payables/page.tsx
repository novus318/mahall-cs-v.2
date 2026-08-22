'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getPayablesReport, downloadPayablesReport } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function PayablesReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate, statusFilter]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (statusFilter) params.status = statusFilter;
            const result = await getPayablesReport(params);
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
            if (statusFilter) params.status = statusFilter;
            const response = await downloadPayablesReport(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payables-report.xlsx`);
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

    const summary = data?.summary;
    const payables = data?.payables || [];

    const statusColor = (s: string) => {
        if (s === 'OVERDUE') return 'destructive';
        if (s === 'PARTIALLY_REPAID') return 'secondary';
        return 'outline';
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Reports
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Payables Report</h2>
                    <p className="mt-2 text-sm text-muted-foreground">All outstanding loans and credits the organization owes.</p>
                </div>
                <Button size="sm" onClick={handleExport} disabled={exporting || loading}>
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export Excel
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                            <Input type="date" className="h-9 bg-background text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">End Date</span>
                            <Input type="date" className="h-9 bg-background text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">Status</span>
                            <select
                                className="h-9 rounded-md border bg-background px-3 text-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Outstanding</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PARTIALLY_REPAID">Partially Repaid</option>
                                <option value="OVERDUE">Overdue</option>
                            </select>
                        </div>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); }}>
                            Clear
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                                <TrendingDown className="h-5 w-5 text-chart-1" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Loan</p>
                                <p className="text-xl font-bold text-chart-1">₹{(summary?.totalLoanAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                                <CheckCircle className="h-5 w-5 text-chart-2" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Repaid</p>
                                <p className="text-xl font-bold text-chart-2">₹{(summary?.totalRepaid || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Balance Due</p>
                                <p className="text-xl font-bold text-destructive">₹{(summary?.totalBalanceDue || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <span className="text-lg font-bold">{summary?.totalCount || 0}</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Active</p>
                                <p className="text-sm text-muted-foreground">{summary?.activeCount || 0} active / {summary?.overdueCount || 0} overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payables Table */}
            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Payables Detail</CardTitle>
                        <CardDescription className="mt-1 text-xs">{payables.length} record(s)</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Lender</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Loan Type</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Repaid</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Balance</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Loan Date</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Due Date</TableHead>
                                    <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : payables.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                            No payables found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payables.map((p: any) => (
                                        <TableRow key={p._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium text-sm">{p.lenderName}</TableCell>
                                            <TableCell className="text-sm">{p.lenderType}</TableCell>
                                            <TableCell className="text-sm">{p.loanType}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">₹{p.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-chart-2">₹{(p.totalRepaid || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-destructive font-bold">
                                                ₹{(p.balanceDue || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm">{p.loanDate ? new Date(p.loanDate).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell className="text-sm">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={statusColor(p.status) as any} className="text-[10px]">{p.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
