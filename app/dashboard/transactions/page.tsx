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
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Global Transactions</h2>
                    <p className="text-muted-foreground text-sm">View and filter financial activity across all accounts.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchTransactions}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="default" size="sm" onClick={async () => {
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

            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-slate-50/50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">

                    {/* Search */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Search</span>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Description..."
                                className="pl-8 h-9 text-sm bg-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Account Filter */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Account</span>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger className="w-full h-9 bg-white text-sm">
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

                    {/* Type Filter */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Type</span>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-full h-9 bg-white text-sm">
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

                    {/* Date Picker (Single Date for now) */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "h-9 justify-start text-left font-normal bg-white",
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
                </div>

                {/* Clear Filters */}
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2 text-muted-foreground hover:text-red-500">
                    <Filter className="h-4 w-4 mr-1" /> Clear
                </Button>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="p-3 border-b bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
                        <Badge variant="secondary" className="font-normal">
                            Total: {totalTransactions}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[110px]">Date</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Balance After</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No transactions match your filters.</TableCell></TableRow>
                            ) : (
                                transactions.map((tx) => {
                                    const isCredit = ['OPENING_BALANCE', 'TRANSFER_IN', 'INCOME'].includes(tx.type);

                                    return (
                                        <TableRow key={tx._id} className="group hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {format(new Date(tx.date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-slate-700">{tx.account?.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{tx.account?.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {tx.description}
                                                {tx.payment && (
                                                    <a href={`/dashboard/payments/${tx.payment._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                                        <ExternalLink className="h-3 w-3" /> {tx.payment.receiptNo}
                                                    </a>
                                                )}
                                                {tx.receipt && (
                                                    <a href={`/dashboard/receipts/${tx.receipt._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
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
                                                        <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 rounded-full border">
                                                            {tx.type === 'TRANSFER_IN' ? 'From' : 'To'}: {tx.relatedAccount.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`font-normal text-[10px] tracking-wider uppercase border-0
                                                    ${isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {tx.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-sm font-medium ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-slate-700">
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
