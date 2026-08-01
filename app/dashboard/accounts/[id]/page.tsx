'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Download, ExternalLink, Building2, Banknote, Star, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AccountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txRes, accRes] = await Promise.all([
                api.get(`/accounts/${params.id}/transactions`),
                api.get(`/accounts/${params.id}`).catch(() => null)
            ]);
            setTransactions(txRes.data.data || []);
            setAccount(accRes?.data?.data || null);
        } catch (error) {
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/accounts/transactions/export?accountId=${params.id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `account-${params.id}-transactions.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download export");
        }
    };

    const isBank = account?.type === 'BANK';

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                            Accounts · Ledger
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            {account?.name || 'Account History'}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View all transactions for this account.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>

            {account && (
                <Card className="bg-card p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                                isBank ? "bg-chart-3/10 text-chart-3" : "bg-chart-1/10 text-chart-1"
                            )}>
                                {isBank ? <Building2 className="h-6 w-6" /> : <Banknote className="h-6 w-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-lg font-semibold">{account.name}</p>
                                    {account.isPrimary && <Star className="h-4 w-4 fill-chart-2 text-chart-2" />}
                                </div>
                                <p className="text-sm text-muted-foreground">{account.holderName} · {account.type}</p>
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-xs font-medium text-muted-foreground">Current Balance</p>
                            <p className={cn(
                                "mt-1 text-3xl font-bold tracking-tight tabular-nums",
                                account.balance < 0 ? "text-destructive" : "text-foreground"
                            )}>
                                ₹{account.balance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {isBank && (
                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Bank</p>
                                <p className="mt-0.5 font-medium">{account.bankName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Account No</p>
                                <p className="mt-0.5 font-mono">{account.accountNumber}</p>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
                    <div>
                        <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                            {loading ? "Loading transactions..." : `${transactions.length} transactions`}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-30 font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Description</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Credit</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Debit</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <ArrowRightLeft className="h-8 w-8 text-muted-foreground/40" />
                                            <p className="text-sm">No transactions found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => {
                                    const isCredit = ['OPENING_BALANCE', 'TRANSFER_IN', 'INCOME', 'LOAN_RECEIVED'].includes(tx.type);

                                    return (
                                        <TableRow key={tx._id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {format(new Date(tx.date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">
                                                {tx.description}
                                                {tx.payment && (
                                                    <a href={`/dashboard/payments/edit/${tx.payment._id}`} className="inline-flex items-center gap-1 ml-2 text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
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
                                                                    ? `/dashboard/houses/${tx.collectionReceipt.payer.entityId?._id}`
                                                                    : `/dashboard/members/${tx.collectionReceipt.payer.entityId?._id}`
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
                                                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                        {tx.type === 'TRANSFER_IN' ? 'From' : 'To'}: {tx.relatedAccount.name}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal text-[10px] tracking-wider uppercase">
                                                    {tx.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm font-semibold text-chart-1">
                                                {isCredit ? `+₹${tx.amount.toLocaleString()}` : ''}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm font-semibold text-destructive">
                                                {!isCredit ? `-₹${tx.amount.toLocaleString()}` : ''}
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
            </Card>
        </div>
    );
}
