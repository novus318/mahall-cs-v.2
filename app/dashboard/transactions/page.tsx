'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, ArrowRight, Download, RefreshCcw, ExternalLink,
    Loader2, Search, Filter, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Filters State
    const [search, setSearch] = useState('');
    const [accountId, setAccountId] = useState('ALL');
    const [type, setType] = useState('ALL');
    const [date, setDate] = useState<Date | undefined>();

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, accountId, type, date, page]);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const { data } = await api.get('/accounts');
            setAccounts(data.data);
        } catch (error) {
            console.error("Failed to load accounts");
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                accountId,
                type
            });

            if (date) {
                params.append('startDate', format(date, 'yyyy-MM-dd'));
                // Just filtering by start date implies that day or forward, 
                // but usually ranges are better. For simplicity now just start date filter or single day?
                // Backend logic: if startDate, $gte. 
            }

            const { data } = await api.get(`/accounts/transactions/all?${params.toString()}`);
            setTransactions(data.data);
            setTotalPages(data.totalPages);
            setTotalTransactions(data.totalTransactions);
        } catch (error) {
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearch('');
        setAccountId('ALL');
        setType('ALL');
        setDate(undefined);
        setPage(1);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Finances · Transactions
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Global Transactions</h2>
                    <p className="mt-2 text-sm text-muted-foreground">View and filter financial activity across all accounts.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchTransactions}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button size="sm" onClick={async () => {
                        try {
                            const params = new URLSearchParams({ search, accountId, type });
                            if (date) params.append('startDate', format(date, 'yyyy-MM-dd'));

                            const response = await api.get(`/accounts/transactions/export?${params.toString()}`, {
                                responseType: 'blob'
                            });

                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `transactions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                        } catch (error) {
                            toast.error("Failed to download export");
                        }
                    }}>
                        <Download className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                </div>
            </div>

            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:items-end">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Search</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Description..."
                                    className="h-9 bg-background pl-9 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Account</span>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="h-9 w-full bg-background text-sm">
                                    <SelectValue placeholder="All Accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Accounts</SelectItem>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Type</span>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-9 w-full bg-background text-sm">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Types</SelectItem>
                                    <SelectItem value="INCOME">Income</SelectItem>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                                    <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                                    <SelectItem value="OPENING_BALANCE">Opening Balance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "h-9 justify-start bg-background text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-9 justify-self-start text-muted-foreground xl:justify-self-end">
                            <Filter className="mr-1 h-4 w-4" /> Clear Filters
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                            {loading ? "Loading transactions..." : `Total: ${totalTransactions} transactions`}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-27.5 font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Account</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Description</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Balance After</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No transactions match your filters.</TableCell></TableRow>
                            ) : (
                                transactions.map((tx) => {
                                    const isCredit = ['OPENING_BALANCE', 'TRANSFER_IN', 'INCOME', 'LOAN_RECEIVED'].includes(tx.type);

                                    return (
                                        <TableRow key={tx._id} className="group hover:bg-muted/50">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {format(new Date(tx.date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{tx.account?.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{tx.account?.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {tx.description}
                                                {tx.payment && (
                                                    <a href={`/dashboard/payments/edit/${tx.payment._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                                        <ExternalLink className="h-3 w-3" /> {tx.payment.receiptNo}
                                                    </a>
                                                )}
                                                {tx.receipt && (
                                                    <a href={`/dashboard/receipts/edit/${tx.receipt._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                                        <ExternalLink className="h-3 w-3" /> {tx.receipt.receiptNo}
                                                    </a>
                                                )}
                                                {tx.collectionReceipt && (
                                                    <span className="inline-flex items-center gap-1 ml-2">
                                                        <span className="text-xs text-muted-foreground">{tx.collectionReceipt.receiptNo}</span>
                                                        {tx.collectionReceipt.payer && (
                                                            <a
                                                                href={tx.collectionReceipt.payer.entityType === 'House'
                                                                    ? `/dashboard/houses/${tx.collectionReceipt.payer.entityId?._id || tx.collectionReceipt.payer.entityId}`
                                                                    : `/dashboard/members/${tx.collectionReceipt.payer.entityId?._id || tx.collectionReceipt.payer.entityId}`
                                                                }
                                                                className="inline-flex items-center gap-1 ml-1 text-primary hover:underline text-xs"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                {tx.collectionReceipt.payer.entityType}
                                                            </a>
                                                        )}
                                                    </span>
                                                )}
                                                {tx.staff && (
                                                    <a href={`/dashboard/staff/${tx.staff._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                                        <ExternalLink className="h-3 w-3" /> Staff Profile
                                                    </a>
                                                )}
                                                {tx.contract && (
                                                    <a href={`/dashboard/contracts/${tx.contract._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                                        <ExternalLink className="h-3 w-3" /> Contract
                                                    </a>
                                                )}
                                                {tx.relatedAccount && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="rounded-full border bg-muted px-1.5 text-[10px] text-muted-foreground">
                                                            {tx.type === 'TRANSFER_IN' ? 'From' : 'To'}: {tx.relatedAccount.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "font-normal text-[10px] tracking-wider uppercase border-0",
                                                    isCredit ? "bg-chart-1/10 text-chart-1" : "bg-destructive/10 text-destructive"
                                                )}>
                                                    {tx.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-right font-mono text-sm font-semibold",
                                                isCredit ? "text-chart-1" : "text-destructive"
                                            )}>
                                                {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm tabular-nums text-foreground">
                                                ₹{tx.balanceAfter.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Next <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
