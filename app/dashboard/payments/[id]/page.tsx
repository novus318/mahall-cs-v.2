'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Printer, Pencil, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function PaymentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [payment, setPayment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const res = await api.get(`/payments/${params.id}`);
                setPayment(res.data.data);
            } catch (error) {
                toast.error("Failed to load payment details");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchPayment();
    }, [params.id, router]);

    if (loading) return <div className="flex flex-1 items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!payment) return <div className="flex flex-1 items-center justify-center p-10 text-center text-muted-foreground">Payment not found</div>;

    return (
        <div className="flex flex-col h-full w-full border-r bg-background print:border-0 print:max-w-none print:!h-auto print:!overflow-visible">
            {/* Command Bar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b print:hidden bg-muted/40">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">Payment Voucher</span>
                        <span className="text-[10px] text-muted-foreground">{payment.receiptNo}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs flex-1 sm:flex-none" onClick={() => router.push(`/dashboard/payments/edit/${payment._id}`)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs flex-1 sm:flex-none" onClick={() => window.open(`/api/payments/${payment._id}/pdf`, '_blank')}>
                        <Printer className="mr-2 h-3.5 w-3.5" /> Print
                    </Button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 print:!p-0 print:!overflow-visible print:!flex-none">
                {/* Voucher Document */}
                <div className="bg-card border shadow-sm max-w-[210mm] mx-auto min-h-[197mm] p-6 sm:p-10 print:!border-0 print:!shadow-none print:!max-w-none print:!min-h-0 print:!p-6 print:!mx-0 print:!w-full">

                    {/* Voucher Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 pb-6 border-b border-double print:mb-4 print:pb-4">
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-wider text-destructive print:text-lg">Payment Voucher</h1>
                            <p className="text-xs text-muted-foreground mt-1">Mahall Committee Expense Record</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <h3 className="text-lg font-mono font-bold text-foreground">{payment.receiptNo}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Date: {format(new Date(payment.date), 'dd MMM yyyy')}</p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mb-8 text-sm print:mb-4 print:gap-y-4">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pay To</span>
                            <div className="font-semibold text-foreground text-base">{payment.payee}</div>
                            {payment.payeeContact && <div className="text-muted-foreground text-xs">{payment.payeeContact}</div>}
                            <div className="text-muted-foreground text-xs">{payment.description || 'No additional notes'}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Paid From</span>
                                <div className="font-medium text-foreground">{payment.account?.name}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Category</span>
                                <div className="font-medium text-foreground">{payment.category?.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-8 print:mb-4 overflow-x-auto">
                        <table className="w-full text-sm border-collapse min-w-[420px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-2 text-left w-12 text-xs font-semibold text-muted-foreground uppercase">#</th>
                                    <th className="py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Particulars</th>
                                    <th className="py-2 text-right w-32 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payment.items.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td className="py-3 text-muted-foreground font-mono text-xs align-top">{index + 1}</td>
                                        <td className="py-3 text-foreground align-top">{item.description}</td>
                                        <td className="py-3 text-right font-mono text-foreground align-top">₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-foreground">
                                    <td colSpan={2} className="py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide pt-4">Total Amount</td>
                                    <td className="py-3 text-right font-bold text-lg text-foreground pt-4">₹{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
