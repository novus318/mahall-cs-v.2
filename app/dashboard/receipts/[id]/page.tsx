'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Pencil, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function ReceiptDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [receipt, setReceipt] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ensure params and id exist before making the request
        if (!params?.id) return;

        const fetchReceipt = async () => {
            try {
                // Safely access params.id as string
                const res = await api.get(`/receipts/${params.id}`);
                setReceipt(res.data.data);
            } catch (error) {
                toast.error("Failed to load receipt details");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchReceipt();
    }, [params, router]);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!receipt) return <div className="p-10 text-center">Receipt not found</div>;

    return (
        <div className="flex flex-col h-full w-full border-r bg-background print:border-0 print:max-w-none">
            {/* Command Bar / Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b print:hidden bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">Income Receipt</span>
                        <span className="text-[10px] text-muted-foreground">{receipt.receiptNo}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push(`/dashboard/receipts/edit/${receipt._id}`)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.print()}>
                        <Printer className="mr-2 h-3.5 w-3.5" /> Print
                    </Button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
                {/* Voucher Document */}
                <div className="bg-white border shadow-sm max-w-[210mm] mx-auto min-h-[197mm] p-10 print:border-0 print:shadow-none print:p-0 print:scale-100">

                    {/* Voucher Header */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-double">
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-wider text-green-800">Official Receipt</h1>
                            <p className="text-xs text-slate-500 mt-1">Mahall Committee Income Record</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-mono font-bold text-slate-900">{receipt.receiptNo}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Date: {format(new Date(receipt.date), 'dd MMM yyyy')}</p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 text-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Received From (Payer)</span>
                            <div className="font-semibold text-slate-900 text-base">{receipt.payer}</div>
                            {receipt.payerContact && <div className="text-slate-600 text-xs">{receipt.payerContact}</div>}
                            <div className="text-slate-500 text-xs">{receipt.description || 'No additional notes'}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Deposited To</span>
                                <div className="font-medium text-slate-700">{receipt.account?.name}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Category</span>
                                <div className="font-medium text-slate-700">{receipt.category?.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-8">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-2 text-left w-12 text-xs font-semibold text-slate-500 uppercase">#</th>
                                    <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase">Particulars</th>
                                    <th className="py-2 text-right w-32 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {receipt.items.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td className="py-3 text-slate-400 font-mono text-xs align-top">{index + 1}</td>
                                        <td className="py-3 text-slate-800 align-top">{item.description}</td>
                                        <td className="py-3 text-right font-mono text-slate-700 align-top">₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-slate-800">
                                    <td colSpan={2} className="py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wide pt-4">Total Received</td>
                                    <td className="py-3 text-right font-bold text-lg text-slate-900 pt-4">₹{receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
