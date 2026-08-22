'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, TrendingUp, Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getReceivablesReport, downloadReceivablesReport } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ReceivablesReportPage() {
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
            const result = await getReceivablesReport(params);
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
            const response = await downloadReceivablesReport(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receivables-report.xlsx`);
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
    const collectionDues = data?.collectionDues || [];
    const rentDues = data?.rentDues || [];

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Reports
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Receivables Report</h2>
                    <p className="mt-2 text-sm text-muted-foreground">All pending dues owed to the organization.</p>
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
                                <option value="">All Pending</option>
                                <option value="PENDING">Pending</option>
                                <option value="PARTIAL">Partial</option>
                            </select>
                        </div>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); }}>
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
                                <Home className="h-5 w-5 text-chart-1" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Collection Dues</p>
                                <p className="text-xl font-bold text-chart-1">₹{(summary?.collectionDues?.pendingAmount || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">{summary?.collectionDues?.count || 0} pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                                <Building2 className="h-5 w-5 text-chart-2" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Rent Dues</p>
                                <p className="text-xl font-bold text-chart-2">₹{(summary?.rentDues?.pendingAmount || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">{summary?.rentDues?.count || 0} pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                                <TrendingUp className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Pending</p>
                                <p className="text-xl font-bold text-destructive">₹{(summary?.grandTotal?.pendingAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Collection Dues Table */}
            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Collection Dues</CardTitle>
                        <CardDescription className="mt-1 text-xs">{collectionDues.length} record(s)</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Entity</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Period</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Paid</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Pending</TableHead>
                                    <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : collectionDues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No collection dues found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    collectionDues.map((d: any) => (
                                        <TableRow key={d._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium text-sm">{d.entityId?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-sm">{d.entityType}</TableCell>
                                            <TableCell className="text-sm">{d.period}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">₹{d.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-chart-1">₹{(d.paidAmount || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-destructive font-bold">
                                                ₹{(d.amount - (d.paidAmount || 0)).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={d.status === 'PARTIAL' ? 'secondary' : 'outline'} className="text-[10px]">{d.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Rent Dues Table */}
            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Rent Dues</CardTitle>
                        <CardDescription className="mt-1 text-xs">{rentDues.length} record(s)</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Tenant</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Period</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Collected</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Pending</TableHead>
                                    <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : rentDues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No rent dues found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rentDues.map((d: any) => (
                                        <TableRow key={d._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium text-sm">{d.contract?.tenant?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-sm">{d.monthYear}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">₹{d.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-chart-1">₹{(d.collectedAmount || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-destructive font-bold">
                                                ₹{(d.amount - (d.collectedAmount || 0)).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={d.status === 'PARTIAL' ? 'secondary' : 'outline'} className="text-[10px]">{d.status}</Badge>
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
