'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function CreateReceiptPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Form State
    const [date, setDate] = useState<Date>(new Date());
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [payer, setPayer] = useState('');
    const [payerContact, setPayerContact] = useState(''); // Added contact number
    const [description, setDescription] = useState(''); // Narration
    const [items, setItems] = useState<{ description: string, amount: string }[]>([
        { description: '', amount: '' },
        { description: '', amount: '' },
        { description: '', amount: '' }
    ]);
    const [nextReceipt, setNextReceipt] = useState('');

    // Inline Category Creation
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [accRes, catRes, setRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/receipts/categories'),
                    api.get('/settings/payments')
                ]);
                setAccounts(accRes.data.data);
                setCategories(catRes.data.data);

                // Calculate Next Receipt for display
                const settings = setRes.data.data;
                const incomeSettings = settings.incomeSettings;
                if (incomeSettings) {
                    const nextStr = `${incomeSettings.receiptPrefix}${String(incomeSettings.receiptCurrentNumber).padStart(3, '0')}`;
                    setNextReceipt(nextStr);
                }
            } catch (error) {
                toast.error("Failed to load dependency data");
            }
        };
        loadData();
    }, []);

    const handleCreateCategory = async () => {
        if (!newCatName.trim()) {
            toast.error("Category name required");
            return;
        }
        try {
            const { data } = await api.post('/receipts/categories', { name: newCatName, description: newCatDesc });
            setCategories([...categories, data.data]);
            setCategoryId(data.data._id); // Auto-select
            toast.success("Category created");
            setIsCatDialogOpen(false);
            setNewCatName('');
            setNewCatDesc('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create category");
        }
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', amount: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) {
            setItems([{ description: '', amount: '' }]); // Reset if last one
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: 'description' | 'amount', value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    };

    const handleSubmit = async () => {
        if (!accountId || !categoryId || !payer) {
            toast.error("Please fill all required fields (Account, Category, Payer)");
            return;
        }

        const validItems = items.filter(i => i.description && i.amount);
        if (validItems.length === 0) {
            toast.error("Please enter at least one item");
            return;
        }

        setLoading(true);
        try {
            await api.post('/receipts', {
                date,
                accountId,
                categoryId,
                payer,
                payerContact, // Added
                description,
                items: validItems.map(i => ({ description: i.description, amount: Number(i.amount) }))
            });
            toast.success("Receipt Saved");
            router.push('/dashboard/receipts');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create receipt");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)] max-w-5xl w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-chart-1">New Income Receipt</h2>
                        <p className="text-muted-foreground text-sm mt-1">Record new income/donation entry.</p>
                    </div>
                </div>
                {nextReceipt && (
                    <div className="flex flex-col items-end px-4">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-dashed border-border mb-0.5">Receipt No</span>
                        <span className="text-xl font-mono font-bold bg-chart-1/10 text-chart-1 px-2 py-0.5 rounded-sm border border-chart-1/20">{nextReceipt}</span>
                    </div>
                )}
            </div>

            <Card className="border-chart-1/10 shadow-sm bg-chart-1/5">
                {/* Header Section: Voucher Details */}
                <div className="bg-muted/30 p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipt Date</Label>
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
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deposit To (Debit Account)</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="w-full bg-background border-input h-9">
                                    <SelectValue placeholder="Select Account" />
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
                            <div className="flex gap-2">
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="w-full bg-background border-input h-9">
                                        <SelectValue placeholder="Income Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => setIsCatDialogOpen(true)}
                                    type="button"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Received From (Payer)</Label>
                                <Input
                                    placeholder="Enter Name of Person or Entity..."
                                    className="bg-background border-input h-9 font-medium"
                                    value={payer}
                                    onChange={(e) => setPayer(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Number (Optional)</Label>
                                <Input
                                    placeholder="Enter Mobile Number..."
                                    className="bg-background border-input h-9 font-medium"
                                    value={payerContact}
                                    onChange={(e) => setPayerContact(e.target.value)}
                                />
                            </div>
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
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-2">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted px-2 h-8 rounded-sm border-b border-transparent focus-visible:border-primary transition-all text-right font-mono"
                                                value={item.amount}
                                                onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveItem(index)}
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
                                            onClick={handleAddItem}
                                            className="text-chart-1 hover:text-chart-1 hover:bg-chart-1/10 -ml-2"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Line
                                        </Button>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Amount</span>
                                            <span className="text-lg font-bold text-foreground font-mono">
                                                ₹{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                            placeholder="Any additional notes..."
                            className="bg-background border-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button size="lg" className="min-w-37.5 shadow-sm bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Receipt
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input placeholder="e.g. Donation" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea placeholder="Optional description" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateCategory}>Create Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
