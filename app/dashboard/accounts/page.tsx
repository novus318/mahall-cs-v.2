'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Wallet, Building2, Banknote, IndianRupee, Loader2, Search, Pencil, Trash2, ArrowRightLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

// Schema for Create/Edit
const accountSchema = z.object({
    name: z.string().min(2, "Name required"),
    type: z.enum(['BANK', 'CASH']),
    holderName: z.string().min(2, "Holder name required"),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    openingBalance: z.coerce.number().min(0, "Balance required").optional(), // Optional for edit
    isPrimary: z.boolean().default(false)
}).refine(data => {
    if (data.type === 'BANK' && (!data.bankName || !data.accountNumber)) {
        return false;
    }
    return true;
}, {
    message: "Bank Name and Account Number required for Banks",
    path: ["type"]
});

// Schema for Transfer
const transferSchema = z.object({
    fromAccountId: z.string().min(1, "Source account required"),
    toAccountId: z.string().min(1, "Destination account required"),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    description: z.string().optional()
}).refine(data => data.fromAccountId !== data.toAccountId, {
    message: "Cannot transfer to the same account",
    path: ["toAccountId"]
});

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: '',
            type: 'BANK',
            holderName: '',
            bankName: '',
            accountNumber: '',
            openingBalance: 0,
            isPrimary: false
        }
    });

    const transferForm = useForm({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            fromAccountId: '',
            toAccountId: '',
            amount: 0,
            description: ''
        }
    });

    const watchType = form.watch('type');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/accounts');
            setAccounts(data.data);
        } catch (error) {
            toast.error("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (values: z.infer<typeof accountSchema>) => {
        try {
            await api.post('/accounts', values);
            toast.success("Account created successfully");
            setIsAddOpen(false);
            form.reset({
                name: '',
                type: 'BANK',
                holderName: '',
                bankName: '',
                accountNumber: '',
                openingBalance: 0,
                isPrimary: false
            });
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create account");
        }
    };

    const handleEditStart = (account: any) => {
        setEditingAccount(account);
        form.reset({
            name: account.name,
            type: account.type, // Type usually shouldn't change, but keeping for now
            holderName: account.holderName,
            bankName: account.bankName || '',
            accountNumber: account.accountNumber || '',
            openingBalance: account.openingBalance, // Display only, shouldn't likely edit logic
            isPrimary: account.isPrimary
        });
        setIsEditOpen(true);
    };

    const handleEdit = async (values: z.infer<typeof accountSchema>) => {
        try {
            await api.put(`/accounts/${editingAccount._id}`, {
                name: values.name,
                holderName: values.holderName,
                bankName: values.bankName,
                accountNumber: values.accountNumber,
                isPrimary: values.isPrimary
            });
            toast.success("Account updated");
            setIsEditOpen(false);
            setEditingAccount(null);
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update account");
        }
    };

    const handleTransfer = async (values: z.infer<typeof transferSchema>) => {
        try {
            await api.post('/accounts/transfer', values);
            toast.success("Transfer successful");
            setIsTransferOpen(false);
            transferForm.reset();
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transfer failed");
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.holderName.toLowerCase().includes(search.toLowerCase()) ||
        acc.bankName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Accounts & Finance</h2>
                    <p className="text-muted-foreground text-sm">Manage accounts, track balances, and transfer funds.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsTransferOpen(true)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                    </Button>
                    <Button onClick={() => setIsAddOpen(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Account
                    </Button>
                </div>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-semibold">All Accounts</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {filteredAccounts.length} active accounts
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search accounts..."
                                className="pl-8 h-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px] h-9"></TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Account Details</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Holder</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Bank Info</TableHead>
                                <TableHead className="text-right h-9 text-xs font-semibold">Balance</TableHead>
                                <TableHead className="text-right h-9 text-xs font-semibold w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : filteredAccounts.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">No accounts found.</TableCell></TableRow>
                            ) : (
                                filteredAccounts.map((acc) => (
                                    <TableRow key={acc._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 cursor-pointer" onClick={() => router.push(`/dashboard/accounts/${acc._id}`)}>
                                        <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className={`p-1.5 w-fit rounded-md mx-auto ${acc.type === 'BANK' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                {acc.type === 'BANK' ? <Building2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm flex items-center gap-1">
                                                    {acc.name}
                                                    {acc.isPrimary && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{acc.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground">{acc.holderName}</TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground">
                                            {acc.type === 'BANK' ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-700">{acc.bankName}</span>
                                                    <span className="font-mono">{acc.accountNumber}</span>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right py-2 font-bold text-sm text-slate-700">
                                            ₹{acc.balance.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-2 text-right">
                                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                                    onClick={() => handleEditStart(acc)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Add New Account</DialogTitle>
                        <DialogDescription>Create a new bank or cash account.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-3">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Type</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(val as 'BANK' | 'CASH')} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='w-full'><SelectValue placeholder="Select type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BANK">Bank Account</SelectItem>
                                            <SelectItem value="CASH">Cash Account</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Nickname</FormLabel>
                                    <FormControl><Input placeholder="e.g., HDFC Main" {...field} value={field.value || ''} /></FormControl>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="holderName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Holder Name</FormLabel>
                                    <FormControl><Input placeholder="Organization Name..." {...field} value={field.value || ''} /></FormControl>
                                </FormItem>
                            )} />

                            {watchType === 'BANK' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField control={form.control} name="bankName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl><Input placeholder="SBI" {...field} value={field.value || ''} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account No</FormLabel>
                                            <FormControl><Input placeholder="XXXXXXXX" {...field} value={field.value || ''} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            <FormField control={form.control} name="openingBalance" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Opening Balance</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                                            <Input type="number" className="pl-7 font-bold" {...field} value={(field.value as number) ?? ''} />
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="isPrimary" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 py-2">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Primary Account</FormLabel>
                                        <FormDescription className="text-xs">
                                            Set as default for transactions
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )} />

                            <DialogFooter>
                                <Button type="submit">Create Account</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                        <DialogDescription>Update account details. Balance cannot be edited directly.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-3">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Nickname</FormLabel>
                                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="holderName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Holder Name</FormLabel>
                                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {form.watch('type') === 'BANK' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField control={form.control} name="bankName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account No</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            <FormField control={form.control} name="isPrimary" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 py-2">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Primary Account</FormLabel>
                                        <FormDescription className="text-xs">
                                            Set as default for transactions
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )} />

                            <DialogFooter>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Transfer Funds</DialogTitle>
                        <DialogDescription>Move money between accounts.</DialogDescription>
                    </DialogHeader>
                    <Form {...transferForm}>
                        <form onSubmit={transferForm.handleSubmit(handleTransfer)} className="space-y-3">
                            <FormField control={transferForm.control} name="fromAccountId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>From Account</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='w-full'><SelectValue placeholder="Select Source" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc._id} value={acc._id}>
                                                    {acc.name} (₹{acc.balance})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={transferForm.control} name="toAccountId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To Account</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='w-full'><SelectValue placeholder="Select Destination" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.filter(a => a._id !== transferForm.watch('fromAccountId')).map(acc => (
                                                <SelectItem key={acc._id} value={acc._id}>
                                                    {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={transferForm.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                                            <Input type="number" className="pl-7 font-bold" {...field} value={(field.value as number) || ''} />
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={transferForm.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Cash Deposit" {...field} /></FormControl>
                                </FormItem>
                            )} />

                            <DialogFooter>
                                <Button type="submit">Transfer</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
