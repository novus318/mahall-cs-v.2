'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Plus, 
    Search, 
    Loader2, 
    Pencil, 
    Trash2, 
    IndianRupee, 
    HandCoins,
    Calendar,
    User,
    Building2,
    ArrowLeftRight,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Clock,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { format } from 'date-fns';

// Schemas
const payableSchema = z.object({
    lenderName: z.string().min(2, "Lender name required"),
    lenderContact: z.string().optional(),
    lenderType: z.enum(['INDIVIDUAL', 'BANK', 'ORGANIZATION', 'OTHER']),
    loanType: z.enum(['LOAN', 'CREDIT', 'ADVANCE', 'BORROWED']),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    interestRate: z.coerce.number().min(0).default(0),
    loanDate: z.string(),
    dueDate: z.string().optional(),
    account: z.string().min(1, "Account required"),
    purpose: z.string().optional(),
    notes: z.string().optional()
});

const repaymentSchema = z.object({
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    account: z.string().min(1, "Account required"),
    date: z.string(),
    notes: z.string().optional()
});

export default function PayablesPage() {
    const [payables, setPayables] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isRepayOpen, setIsRepayOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(payableSchema),
        defaultValues: {
            lenderName: '',
            lenderContact: '',
            lenderType: 'INDIVIDUAL',
            loanType: 'LOAN',
            amount: 0,
            interestRate: 0,
            loanDate: format(new Date(), 'yyyy-MM-dd'),
            dueDate: '',
            account: '',
            purpose: '',
            notes: ''
        }
    });

    const repayForm = useForm({
        resolver: zodResolver(repaymentSchema),
        defaultValues: {
            amount: 0,
            account: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        }
    });

    useEffect(() => {
        fetchPayables();
        fetchAccounts();
    }, []);

    const fetchPayables = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/payables');
            setPayables(data.data);
            setSummary(data.summary);
        } catch (error) {
            toast.error("Failed to load payables");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const { data } = await api.get('/accounts');
            setAccounts(data.data);
        } catch (error) {
            toast.error("Failed to load accounts");
        }
    };

    const handleCreate = async (values: z.infer<typeof payableSchema>) => {
        try {
            await api.post('/payables', values);
            toast.success("Loan/Credit recorded successfully");
            setIsAddOpen(false);
            form.reset();
            fetchPayables();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to record loan");
        }
    };

    const handleRepay = async (values: z.infer<typeof repaymentSchema>) => {
        if (!selectedPayable) return;
        
        try {
            await api.post(`/payables/${selectedPayable._id}/repay`, values);
            toast.success("Repayment recorded successfully");
            setIsRepayOpen(false);
            repayForm.reset();
            setSelectedPayable(null);
            fetchPayables();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to record repayment");
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        
        try {
            await api.delete(`/payables/${deletingId}`);
            toast.success("Payable deleted successfully");
            setIsDeleteOpen(false);
            setDeletingId(null);
            fetchPayables();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete payable");
        }
    };

    const openRepayDialog = (payable: any) => {
        setSelectedPayable(payable);
        repayForm.reset({
            amount: payable.balanceDue,
            account: accounts.find((a: any) => a.isPrimary)?._id || '',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
        setIsRepayOpen(true);
    };

    const openViewDialog = (payable: any) => {
        setSelectedPayable(payable);
        setIsViewOpen(true);
    };

    const confirmDelete = (id: string) => {
        setDeletingId(id);
        setIsDeleteOpen(true);
    };

    const filteredPayables = payables.filter(p => {
        const matchesSearch = 
            p.lenderName.toLowerCase().includes(search.toLowerCase()) ||
            p.lenderContact?.toLowerCase().includes(search.toLowerCase()) ||
            p.purpose?.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'ACTIVE': 'bg-blue-100 text-blue-700 border-blue-200',
            'PARTIALLY_REPAID': 'bg-amber-100 text-amber-700 border-amber-200',
            'REPAID': 'bg-green-100 text-green-700 border-green-200',
            'OVERDUE': 'bg-red-100 text-red-700 border-red-200',
            'CANCELLED': 'bg-gray-100 text-gray-700 border-gray-200'
        };
        
        const icons: Record<string, any> = {
            'ACTIVE': Clock,
            'PARTIALLY_REPAID': ArrowLeftRight,
            'REPAID': CheckCircle2,
            'OVERDUE': AlertCircle,
            'CANCELLED': XCircle
        };
        
        const Icon = icons[status] || Clock;
        
        return (
            <Badge variant="outline" className={`${styles[status] || styles['ACTIVE']} flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payables (Loans & Credit)</h2>
                    <p className="text-muted-foreground text-sm">Manage loans and credit taken from lenders.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Record Loan/Credit
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className='py-2'>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                            <HandCoins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalLoans}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary.activeCount} active
                            </p>
                        </CardContent>
                    </Card>
                    <Card className='py-2'>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{summary.totalAmount?.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                All time borrowed
                            </p>
                        </CardContent>
                    </Card>
                    <Card className='py-2'>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{summary.totalRepaid?.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Amount paid back
                            </p>
                        </CardContent>
                    </Card>
                    <Card className='py-2'>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">₹{summary.totalDue?.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary.overdueCount} overdue
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by lender name, contact..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PARTIALLY_REPAID">Partially Repaid</SelectItem>
                        <SelectItem value="REPAID">Repaid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Payables Table */}
            <Card className="border shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead>Lender</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Repaid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        <Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayables.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        No payables found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayables.map((p) => (
                                    <TableRow key={p._id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{p.lenderName}</span>
                                                {p.lenderContact && (
                                                    <span className="text-xs text-muted-foreground">{p.lenderContact}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{p.loanType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{p.account?.name}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₹{p.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            ₹{p.totalRepaid.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ₹{p.balanceDue.toLocaleString()}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                                        <TableCell>
                                            {p.dueDate ? (
                                                <span className={`text-sm ${p.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''}`}>
                                                    {format(new Date(p.dueDate), 'dd MMM yyyy')}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openViewDialog(p)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {p.status !== 'REPAID' && p.status !== 'CANCELLED' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => openRepayDialog(p)}
                                                    >
                                                        Repay
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => confirmDelete(p._id)}
                                                    disabled={p.totalRepaid > 0}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Add Payable Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record Loan/Credit</DialogTitle>
                        <DialogDescription>
                            Record a new loan or credit from a lender. The amount will be added to the selected account.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="lenderType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lender Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                                    <SelectItem value="BANK">Bank</SelectItem>
                                                    <SelectItem value="ORGANIZATION">Organization</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="loanType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="LOAN">Loan</SelectItem>
                                                    <SelectItem value="CREDIT">Credit</SelectItem>
                                                    <SelectItem value="ADVANCE">Advance</SelectItem>
                                                    <SelectItem value="BORROWED">Borrowed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="lenderName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lender Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., John Doe, HDFC Bank..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lenderContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Phone number or email" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="number" className="pl-9" onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} value={field.value as string | number} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="interestRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Interest Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} value={field.value as string | number} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="loanDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Due Date (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="account"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deposit Account</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc._id} value={acc._id}>
                                                        {acc.name} (₹{acc.balance})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            The loan amount will be added to this account
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purpose (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Emergency funds, Building repair..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional details..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit">Record Loan</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Repay Dialog */}
            <Dialog open={isRepayOpen} onOpenChange={setIsRepayOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Record Repayment</DialogTitle>
                        <DialogDescription>
                            Record repayment for loan from {selectedPayable?.lenderName}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPayable && (
                        <div className="bg-slate-50 p-3 rounded-lg mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Original Amount:</span>
                                <span className="font-medium">₹{selectedPayable.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Already Repaid:</span>
                                <span className="font-medium text-green-600">₹{selectedPayable.totalRepaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2 mt-2">
                                <span className="text-muted-foreground">Balance Due:</span>
                                <span className="font-bold text-amber-600">₹{selectedPayable.balanceDue.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    <Form {...repayForm}>
                        <form onSubmit={repayForm.handleSubmit(handleRepay)} className="space-y-4">
                            <FormField
                                control={repayForm.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Repayment Amount</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-9" onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} value={field.value as string | number} />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={repayForm.control}
                                name="account"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pay From Account</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc._id} value={acc._id}>
                                                        {acc.name} (₹{acc.balance})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            The repayment amount will be deducted from this account
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={repayForm.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Repayment Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={repayForm.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional details..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit">Record Repayment</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Loan Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayable && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedPayable.lenderName}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedPayable.lenderContact || 'No contact'}</p>
                                </div>
                                {getStatusBadge(selectedPayable.status)}
                            </div>

                            {/* Amount Summary */}
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                                    <p className="text-lg font-bold">₹{selectedPayable.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Repaid</p>
                                    <p className="text-lg font-bold text-green-600">₹{selectedPayable.totalRepaid.toLocaleString()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Balance</p>
                                    <p className="text-lg font-bold text-amber-600">₹{selectedPayable.balanceDue.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Loan Type</p>
                                    <p className="font-medium">{selectedPayable.loanType}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Lender Type</p>
                                    <p className="font-medium">{selectedPayable.lenderType}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Interest Rate</p>
                                    <p className="font-medium">{selectedPayable.interestRate}%</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Deposit Account</p>
                                    <p className="font-medium">{selectedPayable.account?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Loan Date</p>
                                    <p className="font-medium">{format(new Date(selectedPayable.loanDate), 'dd MMM yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Due Date</p>
                                    <p className="font-medium">
                                        {selectedPayable.dueDate 
                                            ? format(new Date(selectedPayable.dueDate), 'dd MMM yyyy')
                                            : 'No due date'
                                        }
                                    </p>
                                </div>
                            </div>

                            {selectedPayable.purpose && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                                    <p className="text-sm">{selectedPayable.purpose}</p>
                                </div>
                            )}

                            {selectedPayable.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm">{selectedPayable.notes}</p>
                                </div>
                            )}

                            {/* Repayment History */}
                            {selectedPayable.repayments && selectedPayable.repayments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Repayment History</h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Account</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPayable.repayments.map((repayment: any, idx: number) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            {format(new Date(repayment.date), 'dd MMM yyyy')}
                                                        </TableCell>
                                                        <TableCell>{repayment.account?.name || 'Unknown'}</TableCell>
                                                        <TableCell className="text-right font-medium text-green-600">
                                                            ₹{repayment.amount.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Delete Payable?</DialogTitle>
                        <DialogDescription>
                            This will reverse the loan amount from the account. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
