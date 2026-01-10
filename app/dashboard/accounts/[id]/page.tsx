'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ArrowRightLeft, Download, Filter, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function AccountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accountName, setAccountName] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchTransactions();
        }
    }, [params.id]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Fetch Transations
            const { data } = await api.get(`/accounts/${params.id}/transactions`);
            setTransactions(data.data);

            // Should ideally fetch Account Details separately or extract from a joined query
            // For now, if transactions exist, we might get name, but better to safeguard.
            // Assuming the list view had the data, we could have passed it likely state, 
            // but fetching is safer.
        } catch (error) {
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Account History</h2>
                    <p className="text-muted-foreground text-sm">View all transactions for this account.</p>
                </div>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="p-4 border-b bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
                        <Button variant="outline" size="sm" className="h-8" onClick={async () => {
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
                        }}>
                            <Download className="mr-2 h-3.5 w-3.5" /> Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
                            ) : (
                                transactions.map((tx) => {
                                    const isCredit = ['OPENING_BALANCE', 'TRANSFER_IN', 'INCOME'].includes(tx.type);

                                    return (
                                        <TableRow key={tx._id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {format(new Date(tx.date), 'dd MMM yyyy')}
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
                                                {tx.relatedAccount && (
                                                    <span className="ml-2 text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {tx.type === 'TRANSFER_IN' ? 'From' : 'To'}: {tx.relatedAccount.name}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal text-[10px] tracking-wider uppercase">
                                                    {tx.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm text-green-600">
                                                {isCredit ? `+₹${tx.amount.toLocaleString()}` : ''}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm text-red-600">
                                                {!isCredit ? `-₹${tx.amount.toLocaleString()}` : ''}
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
            </Card>
        </div>
    );
}
