'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Save, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

export default function EditPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Form State
    const [date, setDate] = useState<Date>();
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [payee, setPayee] = useState('');
    const [description, setDescription] = useState('');
    const [receiptNo, setReceiptNo] = useState(''); // Just for display
    const [items, setItems] = useState<{ description: string, amount: string }[]>([
        { description: '', amount: '' }
    ]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [accRes, catRes, payRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/payments/categories'),
                    api.get(`/payments/${params.id}`)
                ]);

                setAccounts(accRes.data.data);
                setCategories(catRes.data.data);

                // Pre-fill Form
                const payment = payRes.data.data;
                setDate(new Date(payment.date));
                setAccountId(payment.account?._id || payment.account);
                setCategoryId(payment.category?._id || payment.category);
                setPayee(payment.payee);
                setDescription(payment.description || '');
                setReceiptNo(payment.receiptNo);

                if (payment.items && payment.items.length > 0) {
                    setItems(payment.items.map((i: any) => ({
                        description: i.description,
                        amount: String(i.amount)
                    })));
                }
            } catch (error) {
                toast.error("Failed to load payment details");
                router.push('/dashboard/payments');
            }
        };
        loadData();
    }, [params.id, router]);

    // ... (rest of UI similar to create)
    // I will write the FULL file assuming `api.get('/payments/' + params.id)` works.
    // I will add that route immediately.

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Edit Payment</h2>
                        <p className="text-muted-foreground text-sm">Modify payment details.</p>
                    </div>
                </div>
                <div className="flex flex-col items-end px-4">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-dashed border-border mb-0.5">Voucher No</span>
                    <span className="text-xl font-mono font-bold text-foreground bg-muted/30 px-2 py-0.5 rounded-sm border border-border/50">{receiptNo || 'Loading...'}</span>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card">
                {/* Header Section: Voucher Details */}
                <div className="bg-muted/30 p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voucher Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-background border-input h-9",
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
                                        onSelect={(d) => d && setDate(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid From (Credit Account)</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="w-full bg-background border-input h-9">
                                    <SelectValue placeholder="Select Bank/Cash Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc._id} value={acc._id}>
                                            <span className="flex justify-between w-full gap-4">
                                                <span>{acc.name}</span>
                                                <span className="text-muted-foreground font-mono">₹{acc.balance.toLocaleString()}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-full bg-background border-input h-9">
                                    <SelectValue placeholder="Expense Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payee (Paid To)</Label>
                            <Input
                                placeholder="Enter Name of Person or Entity..."
                                className="bg-background border-input h-9 font-medium"
                                value={payee}
                                onChange={(e) => setPayee(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Ledger Table Section */}
                <div className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 w-12 text-center">#</th>
                                    <th className="px-6 py-3">Particulars (Item Description)</th>
                                    <th className="px-6 py-3 w-48 text-right">Amount (₹)</th>
                                    <th className="px-6 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((item, index) => (
                                    <tr key={index} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-2 text-center text-muted-foreground font-mono text-xs">{index + 1}</td>
                                        <td className="px-6 py-2">
                                            <Input
                                                placeholder="Enter item description..."
                                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted px-2 h-8 rounded-sm border-b border-transparent focus-visible:border-primary transition-all placeholder:text-muted-foreground/50"
                                                value={item.description}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[index].description = e.target.value;
                                                    setItems(newItems);
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-2">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted px-2 h-8 rounded-sm border-b border-transparent focus-visible:border-primary transition-all text-right font-mono"
                                                value={item.amount}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[index].amount = e.target.value;
                                                    setItems(newItems);
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    const newItems = [...items];
                                                    newItems.splice(index, 1);
                                                    setItems(newItems);
                                                }}
                                                tabIndex={-1}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/20 border-t border-border">
                                <tr>
                                    <td colSpan={2} className="px-6 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setItems([...items, { description: '', amount: '' }])}
                                            className="text-primary hover:text-primary hover:bg-primary/10 -ml-2"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Expected Line
                                        </Button>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Amount</span>
                                            <span className="text-lg font-bold text-foreground font-mono">
                                                ₹{items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Section: Narration & Actions */}
                <div className="bg-muted/30 p-6 border-t border-border space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Narration / Remarks</Label>
                        <Input
                            placeholder="Any additional notes or remarks for this voucher..."
                            className="bg-background border-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button size="lg" className="min-w-[150px] shadow-sm" onClick={async () => {
                            if (!date || !accountId || !categoryId) {
                                toast.error("Please fill required fields (Date, Account, Category)");
                                return;
                            }

                            const validItems = items.filter(i => i.amount && Number(i.amount) > 0);
                            if (validItems.length === 0) {
                                toast.error("Please add at least one valid item amount");
                                return;
                            }

                            setLoading(true);
                            try {
                                await api.put(`/payments/${params.id}`, {
                                    date,
                                    accountId,
                                    categoryId,
                                    payee,
                                    description,
                                    items: validItems
                                });
                                toast.success("Payment Updated Successfully");
                                router.push('/dashboard/payments');
                            } catch (error: any) {
                                toast.error(error.response?.data?.message || "Failed to update payment");
                            } finally {
                                setLoading(false);
                            }
                        }} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Update Voucher
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
