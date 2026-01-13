'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, ArrowLeft, Plus, Trash2, Save, Loader2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CreatePaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Category Creation State
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Form State
    const [date, setDate] = useState<Date>(new Date());
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [payee, setPayee] = useState('');
    const [payeeContact, setPayeeContact] = useState(''); // Added
    const [description, setDescription] = useState(''); // Narration
    const [items, setItems] = useState<{ description: string, amount: string }[]>([
        { description: '', amount: '' },
        { description: '', amount: '' },
        { description: '', amount: '' }
    ]);
    const [nextReceipt, setNextReceipt] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [accRes, catRes, setRes] = await Promise.all([
                    api.get('/accounts'),
                    api.get('/payments/categories'),
                    api.get('/settings/payments')
                ]);
                setAccounts(accRes.data.data);
                setCategories(catRes.data.data);

                // Calculate Next Receipt for display
                const settings = setRes.data.data?.paymentSettings;
                if (settings) {
                    const nextStr = `${settings.receiptPrefix}${String(settings.receiptCurrentNumber).padStart(3, '0')}`;
                    setNextReceipt(nextStr);
                }
            } catch (error) {
                toast.error("Failed to load dependency data");
            }
        };
        loadData();
    }, []);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error("Category name is required");
            return;
        }
        setCreatingCategory(true);
        try {
            const res = await api.post('/payments/categories', { name: newCategoryName });
            const newCategory = res.data.data;
            setCategories([...categories, newCategory]);
            setCategoryId(newCategory._id);
            setIsCategoryDialogOpen(false);
            setNewCategoryName('');
            toast.success("Category created");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create category");
        } finally {
            setCreatingCategory(false);
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
        if (!accountId || !categoryId || !payee) {
            toast.error("Please fill all required fields (Account, Category, Payee)");
            return;
        }

        const validItems = items.filter(i => i.description && i.amount);
        if (validItems.length === 0) {
            toast.error("Please enter at least one item");
            return;
        }

        setLoading(true);
        try {
            await api.post('/payments', {
                date,
                accountId,
                categoryId,
                payee,
                payeeContact, // Added
                description,
                items: validItems.map(i => ({ description: i.description, amount: Number(i.amount) }))
            });
            toast.success("Payment Voucher Saved");
            router.push('/dashboard/payments');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0 max-w-5xl w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-rose-700">Expense Payment</h2>
                        <p className="text-muted-foreground text-sm">Create a new expense entry.</p>
                    </div>
                </div>
                {nextReceipt && (
                    <div className="flex flex-col items-end px-4">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b border-dashed border-border mb-0.5">Voucher No</span>
                        <span className="text-xl font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-200">{nextReceipt}</span>
                    </div>
                )}
            </div>

            <Card className="border-rose-100 shadow-sm bg-rose-50/30">
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
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Category</DialogTitle>
                                            <DialogDescription>Add a new expense category to the list.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label htmlFor="catName" className="mb-2 block">Category Name</Label>
                                            <Input
                                                id="catName"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="e.g. Office Supplies"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateCategory} disabled={creatingCategory}>
                                                {creatingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payee (Paid To)</Label>
                                <Input
                                    placeholder="Enter Name of Person or Entity..."
                                    className="bg-background border-input h-9 font-medium"
                                    value={payee}
                                    onChange={(e) => setPayee(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Number (Optional)</Label>
                                <Input
                                    placeholder="Enter Mobile Number..."
                                    className="bg-background border-input h-9 font-medium"
                                    value={payeeContact}
                                    onChange={(e) => setPayeeContact(e.target.value)}
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
                                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 -ml-2"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Expected Line
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
                            placeholder="Any additional notes or remarks for this voucher..."
                            className="bg-background border-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button size="lg" className="min-w-37.5 shadow-sm bg-rose-600 hover:bg-rose-700" onClick={handleSubmit} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Voucher
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
