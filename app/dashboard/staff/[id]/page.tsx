'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, User, Phone, Mail, Building2, Briefcase, Calendar, Plus, Wallet, FileText, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, differenceInYears } from 'date-fns';
import api from '@/lib/axios';

// Schemas
const advanceSchema = z.object({
    amount: z.coerce.number().min(1, "Amount required"),
    notes: z.string().optional()
});

// Generation only needs Month/Year
const generateSchema = z.object({
    month: z.string(),
    year: z.string(),
});

// Payment now includes deductions
const paymentSchema = z.object({
    leaveDays: z.coerce.number().min(0).default(0),
    advanceDeduction: z.coerce.number().min(0).default(0)
});

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [staff, setStaff] = useState<any>(null);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
    const [isPayslipOpen, setIsPayslipOpen] = useState(false);

    // Payment Dialog State
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

    const advanceForm = useForm({
        resolver: zodResolver(advanceSchema),
        defaultValues: { amount: 0, notes: '' }
    });

    const generateForm = useForm({
        resolver: zodResolver(generateSchema),
        defaultValues: {
            month: String(new Date().getMonth() + 1),
            year: String(new Date().getFullYear()),
        }
    });

    const paymentForm = useForm({
        resolver: zodResolver(paymentSchema),
        defaultValues: { leaveDays: 0, advanceDeduction: 0 }
    });

    useEffect(() => {
        if (resolvedParams.id) fetchData();
    }, [resolvedParams.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/staff/${resolvedParams.id}`);
            setStaff(data.data.staff);
            setPayslips(data.data.payslips);
            setTransactions(data.data.transactions);
        } catch (error) {
            toast.error("Failed to load staff details");
        } finally {
            setLoading(false);
        }
    };

    const handleGiveAdvance = async (values: any) => {
        try {
            await api.post(`/staff/${resolvedParams.id}/advance`, values);
            toast.success("Advance given successfully");
            setIsAdvanceOpen(false);
            advanceForm.reset();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to give advance");
        }
    };

    const handleGeneratePayslip = async (values: any) => {
        try {
            await api.post(`/staff/${resolvedParams.id}/payslips`, { ...values, leaveDays: 0, advanceDeduction: 0 }); // Send initial values
            toast.success("Payslip generated (Pending)");
            setIsPayslipOpen(false);
            generateForm.reset();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Generation failed");
        }
    };

    const openPaymentDialog = (payslip: any) => {
        setSelectedPayslip(payslip);
        paymentForm.reset({ leaveDays: 0, advanceDeduction: 0 });
        setIsPayOpen(true);
    };

    const handleConfirmPayment = async (values: any) => {
        if (!selectedPayslip) return;
        try {
            await api.put(`/staff/${resolvedParams.id}/payslips/${selectedPayslip._id}/pay`, values);
            toast.success("Payment successful");
            setIsPayOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Payment failed");
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!staff) return <div className="p-8 text-center text-muted-foreground">Staff not found</div>;

    // Calculation Helper for Payment Preview
    const currentSalary = staff.baseSalary;
    const payLeave = paymentForm.watch('leaveDays') || 0;
    const payAdvance = paymentForm.watch('advanceDeduction') || 0;
    const leaveCost = Math.round((currentSalary / 30) * Number(payLeave));
    const estimatedNet = Math.max(0, currentSalary - leaveCost - Number(payAdvance));

    // Calculate Age
    const age = differenceInYears(new Date(), new Date(staff.dob));

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center gap-4 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        {staff.name}
                        <Badge variant={staff.status === 'ACTIVE' ? 'default' : 'secondary'} className={staff.status === 'ACTIVE' ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>{staff.status}</Badge>
                    </h2>
                    <div className="text-muted-foreground text-sm flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {staff.position}</span>
                        <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {staff.department}</span>
                        <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{staff.employeeId}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-3 h-full overflow-hidden">
                {/* Left Column: Info & Stats */}
                <div className="space-y-4 overflow-y-auto pb-10">
                    <Card className="shadow-sm border-slate-200 py-3">
                        <CardHeader className=""><CardTitle className="text-base font-semibold text-slate-800">Financial Overview</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">Base Salary</span>
                                <span className="font-bold text-xl text-slate-900">₹{staff.baseSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                                <div>
                                    <span className="text-sm font-medium text-orange-900">Advance Balance</span>
                                    <p className="text-[11px] text-orange-600 mt-0.5">Deductible from future pay</p>
                                </div>
                                <span className="font-bold text-xl text-orange-700">₹{staff.currentAdvance.toLocaleString()}</span>
                            </div>
                            <Button className="w-full" variant="outline" onClick={() => setIsAdvanceOpen(true)}>
                                <Wallet className="mr-2 h-4 w-4" /> Give Advance
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 py-3">
                        <CardHeader className=""><CardTitle className="text-base font-semibold text-slate-800">Employee Details</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Join Date</span><span className="font-medium text-slate-700">{format(new Date(staff.joinDate), 'dd MMM yyyy')}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Phone</span><span className="font-medium text-slate-700">{staff.phone}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Email</span><span className="font-medium text-slate-700">{staff.email || '-'}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">DOB</span><span className="font-medium text-slate-700">{format(new Date(staff.dob), 'dd MMM yyyy')} <span className="text-muted-foreground text-xs">({age} yrs)</span></span></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Payroll & History */}
                <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                    <Tabs defaultValue="payslips" className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <TabsList className="bg-slate-100">
                                <TabsTrigger value="payslips">Payslips</TabsTrigger>
                                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                            </TabsList>
                            <Button size="sm" onClick={() => setIsPayslipOpen(true)} className="shadow-sm">
                                <FileText className="mr-2 h-4 w-4" /> Generate Payslip
                            </Button>
                        </div>

                        <TabsContent value="payslips" className="flex-1 overflow-auto border rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Month</TableHead>
                                        <TableHead>Base</TableHead>
                                        <TableHead>Deductions</TableHead>
                                        <TableHead>Net Pay</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payslips.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground">No payslips generated yet</TableCell></TableRow> :
                                        payslips.map(slip => (
                                            <TableRow key={slip._id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium">{slip.monthYear}</TableCell>
                                                <TableCell>₹{slip.baseSalary.toLocaleString()}</TableCell>
                                                <TableCell className="text-xs text-red-600">
                                                    {slip.leaveDeduction > 0 && <div className="whitespace-nowrap">-₹{slip.leaveDeduction} (Leave)</div>}
                                                    {slip.advanceDeduction > 0 && <div className="whitespace-nowrap">-₹{slip.advanceDeduction} (Adv)</div>}
                                                    {slip.leaveDeduction === 0 && slip.advanceDeduction === 0 && <span className="text-slate-400">-</span>}
                                                </TableCell>
                                                <TableCell className="font-bold text-slate-800">₹{slip.finalAmount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={slip.status === 'PAID' ? 'default' : 'secondary'} className={slip.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200'}>{slip.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {slip.status !== 'PAID' ? (
                                                        <Button size="sm" onClick={() => openPaymentDialog(slip)}>Pay Now</Button>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground font-medium">Pd: {slip.paymentDate ? format(new Date(slip.paymentDate), 'dd MMM') : '-'}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="transactions" className="flex-1 overflow-auto border rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-32 text-muted-foreground">No transactions found</TableCell></TableRow> :
                                        transactions.map(tx => (
                                            <TableRow key={tx._id} className="group hover:bg-slate-50/50">
                                                <TableCell className="text-xs font-mono text-muted-foreground group-hover:text-slate-600">{format(new Date(tx.date), 'dd MMM yyyy, HH:mm')}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
                                                        {tx.type.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{tx.notes}</TableCell>
                                                <TableCell className={`text-right font-mono font-medium ${tx.type === 'ADVANCE_REPAID' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'ADVANCE_REPAID' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Give Advance Dialog */}
            <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Give Salary Advance</DialogTitle><DialogDescription>Valid only if funds are disbursed.</DialogDescription></DialogHeader>
                    <Form {...advanceForm}>
                        <form onSubmit={advanceForm.handleSubmit(handleGiveAdvance)} className="space-y-4">
                            <FormField control={advanceForm.control} name="amount" render={({ field: { value, onChange, ...fieldProps } }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" className="font-bold" {...fieldProps} value={String(value || '')} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={advanceForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Input placeholder="Reason..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter><Button type="submit">Confirm Advance</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Generate Payslip Dialog (Simplified) */}
            <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader><DialogTitle>Generate Payslip</DialogTitle><DialogDescription>Create a pending payslip for {staff.name}.</DialogDescription></DialogHeader>
                    <Form {...generateForm}>
                        <form onSubmit={generateForm.handleSubmit(handleGeneratePayslip)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={generateForm.control} name="month" render={({ field }) => (<FormItem><FormLabel>Month</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={generateForm.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <DialogFooter><Button type="submit">Generate Draft</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog (New) */}
            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Process Salary Payment</DialogTitle>
                        <DialogDescription>Review deductions and confirm final payout for {selectedPayslip?.monthYear}.</DialogDescription>
                    </DialogHeader>
                    <Form {...paymentForm}>
                        <form onSubmit={paymentForm.handleSubmit(handleConfirmPayment)} className="space-y-4">
                            <div className="p-4 bg-slate-50 border rounded-lg space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Base Salary</span>
                                    <span className="font-semibold">₹{staff.baseSalary.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-200" />
                                <div className="space-y-3 pt-1">
                                    <FormField control={paymentForm.control} name="leaveDays" render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem className="flex flex-row items-center justify-between space-y-0 gap-4">
                                            <div className="space-y-0.5"><FormLabel className="text-base">Unpaid Leave Days</FormLabel><p className="text-[11px] text-muted-foreground">Daily Rate: ₹{Math.round(staff.baseSalary / 30)}</p></div>
                                            <FormControl><Input type="number" className="w-24 text-right" {...fieldProps} value={String(value || '')} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={paymentForm.control} name="advanceDeduction" render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem className="flex flex-row items-center justify-between space-y-0 gap-4">
                                            <div className="space-y-0.5"><FormLabel className="text-base">Deduct Advance</FormLabel><p className="text-[11px] text-orange-600">Max Balance: ₹{staff.currentAdvance}</p></div>
                                            <FormControl><Input type="number" className="w-24 text-right" {...fieldProps} value={String(value || '')} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="h-px bg-slate-200" />
                                <div className="flex justify-between items-center pt-1">
                                    <span className="font-semibold text-lg">Net Payable</span>
                                    <span className="font-bold text-2xl text-green-700">₹{estimatedNet.toLocaleString()}</span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700">Confirm Payment</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
