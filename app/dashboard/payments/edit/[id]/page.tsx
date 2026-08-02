'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Save, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog,AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const underlineInput = "h-auto rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 text-base shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 md:text-base";

export default function EditPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Category Creation State
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Form State
    const [date, setDate] = useState<Date>();
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [payee, setPayee] = useState('');
    const [payeeContact, setPayeeContact] = useState(''); // Added
    const [description, setDescription] = useState('');
    const [receiptNo, setReceiptNo] = useState(''); // Just for display
    const [paymentStatus, setPaymentStatus] = useState('PENDING');
    const [items, setItems] = useState<{ description: string, amount: string }[]>([
        { description: '', amount: '' }
    ]);

    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setDataLoading(true);
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
                setPayeeContact(payment.payeeContact || ''); // Added
                setDescription(payment.description || '');
                setReceiptNo(payment.receiptNo);
                setPaymentStatus(payment.status || 'PENDING');

                if (payment.items && payment.items.length > 0) {
                    setItems(payment.items.map((i: any) => ({
                        description: i.description,
                        amount: String(i.amount)
                    })));
                }
            } catch (error) {
                toast.error("Failed to load payment details");
                router.push('/dashboard/payments');
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, [params.id, router]);

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

    // ... (rest of UI similar to create)
    // I will write the FULL file assuming `api.get('/payments/' + params.id)` works.
    // I will add that route immediately.

    const handleMarkAsPaid = async () => {
        setActionLoading(true);
        try {
            await api.put(`/payments/${params.id}/mark-paid`, {});
            toast.success("Payment marked as completed");
            setPaymentStatus('COMPLETED');
            router.push('/dashboard/payments');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to mark payment as paid");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePayment = async () => {
        setActionLoading(true);
        try {
            await api.delete(`/payments/${params.id}`);
            toast.success("Payment deleted successfully");
            setIsDeleteDialogOpen(false);
            router.push('/dashboard/payments');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete payment");
            setActionLoading(false);
        }
    };

    // Show skeleton loading while data is loading
    if (dataLoading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-6 pt-0 max-w-5xl w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                </div>

                <Skeleton className="h-10 w-48" />

                <Card className="border-destructive/10 shadow-sm bg-destructive/5">
                    <div className="bg-muted/30 p-6 border-b border-border space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                    <div className="bg-muted/30 p-6 border-t border-border">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)] max-w-5xl  w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1 sm:mt-0"><ArrowLeft className="h-5 w-5" /></Button>
                    <div>
                        <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                            Expense · Edit Payment
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mt-2">Update Payment</h2>
                        <p className="text-muted-foreground text-sm mt-1">Modify payment details.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Status Badge */}
                    <Badge 
                        variant={paymentStatus === 'COMPLETED' ? 'default' : paymentStatus === 'PENDING' ? 'outline' : 'destructive'}
                        className={`px-3 py-1 text-sm ${
                            paymentStatus === 'COMPLETED' ? 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/10' : 
                            paymentStatus === 'PENDING' ? 'bg-chart-2/10 text-chart-2 hover:bg-chart-2/10' : 
                            'bg-destructive/10 text-destructive hover:bg-destructive/10'
                        }`}
                    >
                        {paymentStatus === 'COMPLETED' ? '✓ Completed' : paymentStatus === 'PENDING' ? '⏳ Pending' : '🗑️ Deleted'}
                    </Badge>
                    <div className="flex flex-col items-start sm:items-end gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Voucher No</span>
                        <span className="text-xl font-mono font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-md border border-destructive/20">{receiptNo || 'Loading...'}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons for Pending/Completed Payments - Hide for DELETED */}
            {paymentStatus !== 'DELETED' && (
                <div className="flex flex-wrap gap-2">
                    {paymentStatus === 'PENDING' && (
                        <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90" onClick={handleMarkAsPaid} disabled={actionLoading}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Mark as Paid
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={actionLoading}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                </div>
            )}

            <Card className="border-border shadow-sm bg-card">
                {/* Header Section: Voucher Details */}
                <div className="bg-muted/30 p-4 sm:p-6 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voucher Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 h-auto shadow-none",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
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

                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid From (Credit Account)</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="w-full rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 h-auto shadow-none">
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

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1 text-destructive hover:text-destructive hover:bg-destructive/10">
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[420px]">
                                        <DialogHeader>
                                            <DialogTitle>Create New Category</DialogTitle>
                                            <DialogDescription>Add a new expense category to the list.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-1">
                                            <Label htmlFor="catName" className="mb-1 block">Category Name</Label>
                                            <Input
                                                id="catName"
                                                className={underlineInput}
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="e.g. Office Supplies"
                                            />
                                        </div>
                                        <DialogFooter className="gap-2 sm:justify-end">
                                            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleCreateCategory} disabled={creatingCategory} className="w-full sm:w-auto">
                                                {creatingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-full rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 h-auto shadow-none">
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

                    <div className="mt-5 pt-4 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payee (Paid To)</Label>
                                <Input
                                    placeholder="Enter Name of Person or Entity..."
                                    className={underlineInput}
                                    value={payee}
                                    onChange={(e) => setPayee(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Number</Label>
                                <Input
                                    placeholder="Enter Mobile Number..."
                                    className={underlineInput}
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
                        <table className="w-full text-sm text-left min-w-[560px]">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 w-12 text-center">#</th>
                                    <th className="px-4 sm:px-6 py-3">Particulars (Item Description)</th>
                                    <th className="px-4 sm:px-6 py-3 w-48 text-right">Amount (₹)</th>
                                    <th className="px-4 sm:px-6 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((item, index) => (
                                    <tr key={index} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-4 sm:px-6 py-2 text-center text-muted-foreground font-mono text-xs">{index + 1}</td>
                                        <td className="px-4 sm:px-6 py-2">
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
                                        <td className="px-4 sm:px-6 py-2">
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
                                        <td className="px-4 sm:px-6 py-2 text-right">
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
                                    <td colSpan={2} className="px-4 sm:px-6 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setItems([...items, { description: '', amount: '' }])}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Expected Line
                                        </Button>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 text-right">
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
                <div className="bg-muted/30 p-4 sm:p-6 border-t border-border space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Narration / Remarks</Label>
                        <Input
                            placeholder="Any additional notes or remarks for this voucher..."
                            className={underlineInput}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => router.back()} disabled={loading}>
                            Cancel
                        </Button>
                        <Button size="lg" className="w-full sm:w-auto shadow-sm bg-destructive hover:bg-destructive/90" onClick={async () => {
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
                                    payeeContact, // Added
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

            {/* Delete Payment Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this payment? This action cannot be undone and will reverse the account balance if the payment was completed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeletePayment} 
                            disabled={actionLoading}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
