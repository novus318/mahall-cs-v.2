'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, User, Phone, Mail, Building2, Briefcase, Calendar, Plus, Wallet, FileText, Download, CheckCircle2, Loader2, Landmark, ShieldAlert, LockKeyhole, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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

// Edit Staff Schema
const editStaffSchema = z.object({
    name: z.string().min(2, "Name required"),
    dob: z.string().min(1, "Date of Birth required"),
    employeeId: z.string().min(1, "ID required"),
    department: z.string().min(1, "Department required"),
    position: z.string().min(1, "Position required"),
    baseSalary: z.coerce.number().min(0, "Salary required"),
    phone: z.string().min(10, "Valid phone required"),
    email: z.string().email().optional().or(z.literal('')),
    joinDate: z.string().min(1, "Join Date required"),
    address: z.object({
        fullAddress: z.string().optional(),
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional()
    }).optional(),
    emergencyContact: z.object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        alternatePhone: z.string().optional()
    }).optional(),
    qualifications: z.string().optional(),
    religion: z.string().optional(),
    otherAllowance: z.coerce.number().min(0).optional(),
    jobDescription: z.string().optional(),
    additionalInfo: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE'])
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
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Payment Dialog State
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>("");

    // Rejection State
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

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

    const editForm = useForm({
        resolver: zodResolver(editStaffSchema),
        defaultValues: {
            name: '',
            dob: '',
            employeeId: '',
            department: '',
            position: '',
            baseSalary: 0,
            phone: '',
            email: '',
            joinDate: '',
            address: {
                fullAddress: '',
                street: '',
                city: '',
                state: '',
                pincode: ''
            },
            emergencyContact: {
                name: '',
                relationship: '',
                phone: '',
                alternatePhone: ''
            },
            qualifications: '',
            religion: '',
            otherAllowance: 0,
            jobDescription: '',
            additionalInfo: '',
            status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
        }
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

    const openPaymentDialog = async (payslip: any) => {
        setSelectedPayslip(payslip);
        paymentForm.reset({ leaveDays: 0, advanceDeduction: 0 });

        // Fetch Accounts
        try {
            const { data } = await api.get('/accounts?status=ACTIVE');
            setAccounts(data.data || []);
            const defaultAcc = data.data.find((a: any) => a.isPrimary) || data.data[0];
            if (defaultAcc) setSelectedAccount(defaultAcc._id);
        } catch (e) {
            console.error("Failed to load accounts");
        }

        setIsPayOpen(true);
    };

    const handleConfirmPayment = async (values: any) => {
        if (!selectedPayslip || !selectedAccount) return;
        try {
            await api.put(`/staff/${resolvedParams.id}/payslips/${selectedPayslip._id}/pay`, { ...values, accountId: selectedAccount });
            toast.success("Payment successful");
            setIsPayOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Payment failed");
        }
    };

    const handleInitiateRejection = async () => {
        if (!selectedPayslip) return;
        setSendingOtp(true);
        try {
            await api.post(`/staff/${resolvedParams.id}/payslips/${selectedPayslip._id}/reject/initiate`);
            toast.success("OTP sent to administrators");
            setIsPayOpen(false);
            setIsOtpOpen(true);
            setOtp("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate rejection");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleConfirmRejection = async () => {
        if (!selectedPayslip || otp.length < 6) return;
        setVerifyingOtp(true);
        try {
            await api.post(`/staff/${resolvedParams.id}/payslips/${selectedPayslip._id}/reject/confirm`, { otp });
            toast.success("Payslip rejected successfully");
            setIsOtpOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid OTP");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const openEditDialog = () => {
        if (!staff) return;
        editForm.reset({
            name: staff.name || '',
            dob: staff.dob ? new Date(staff.dob).toISOString().split('T')[0] : '',
            employeeId: staff.employeeId || '',
            department: staff.department || '',
            position: staff.position || '',
            baseSalary: staff.baseSalary || 0,
            phone: staff.phone || '',
            email: staff.email || '',
            joinDate: staff.joinDate ? new Date(staff.joinDate).toISOString().split('T')[0] : '',
            address: {
                fullAddress: staff.address?.fullAddress || '',
                street: staff.address?.street || '',
                city: staff.address?.city || '',
                state: staff.address?.state || '',
                pincode: staff.address?.pincode || ''
            },
            emergencyContact: {
                name: staff.emergencyContact?.name || '',
                relationship: staff.emergencyContact?.relationship || '',
                phone: staff.emergencyContact?.phone || '',
                alternatePhone: staff.emergencyContact?.alternatePhone || ''
            },
            qualifications: staff.qualifications || '',
            religion: staff.religion || '',
            otherAllowance: staff.otherAllowance || 0,
            jobDescription: staff.jobDescription || '',
            additionalInfo: staff.additionalInfo || '',
            status: staff.status || 'ACTIVE'
        });
        setIsEditOpen(true);
    };

    const handleUpdateStaff = async (values: z.infer<typeof editStaffSchema>) => {
        try {
            await api.put(`/staff/${resolvedParams.id}`, values);
            toast.success("Staff updated successfully");
            setIsEditOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update staff");
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
            <div className="flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
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
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Details
                </Button>
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
                            {staff.religion && <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Religion</span><span className="font-medium text-slate-700">{staff.religion}</span></div>}
                            {staff.qualifications && <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Qualifications</span><span className="font-medium text-slate-700">{staff.qualifications}</span></div>}
                            {staff.otherAllowance > 0 && <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Other Allowance</span><span className="font-medium text-slate-700">₹{staff.otherAllowance.toLocaleString()}</span></div>}
                        </CardContent>
                    </Card>

                    {(staff.address?.fullAddress || staff.address?.city) && (
                        <Card className="shadow-sm border-slate-200 py-3">
                            <CardHeader className=""><CardTitle className="text-base font-semibold text-slate-800">Address</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {staff.address?.fullAddress && <p className="text-slate-700 leading-relaxed">{staff.address.fullAddress}</p>}
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                    {staff.address?.city && <span>{staff.address.city}</span>}
                                    {staff.address?.state && <span>{staff.address.state}</span>}
                                    {staff.address?.pincode && <span>{staff.address.pincode}</span>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {staff.emergencyContact?.name && (
                        <Card className="shadow-sm border-slate-200 py-3">
                            <CardHeader className=""><CardTitle className="text-base font-semibold text-slate-800">Emergency Contact</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Name</span><span className="font-medium text-slate-700">{staff.emergencyContact.name}</span></div>
                                {staff.emergencyContact.relationship && <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Relationship</span><span className="font-medium text-slate-700">{staff.emergencyContact.relationship}</span></div>}
                                {staff.emergencyContact.phone && <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Phone</span><span className="font-medium text-slate-700">{staff.emergencyContact.phone}</span></div>}
                                {staff.emergencyContact.alternatePhone && <div className="flex justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-muted-foreground">Alt. Phone</span><span className="font-medium text-slate-700">{staff.emergencyContact.alternatePhone}</span></div>}
                            </CardContent>
                        </Card>
                    )}

                    {staff.jobDescription && (
                        <Card className="shadow-sm border-slate-200 py-3">
                            <CardHeader className=""><CardTitle className="text-base font-semibold text-slate-800">Job Description</CardTitle></CardHeader>
                            <CardContent className="text-sm">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{staff.jobDescription}</p>
                            </CardContent>
                        </Card>
                    )}

                    {staff.additionalInfo && (
                        <Card className="shadow-sm border-slate-200 py-3">
                            <CardHeader className=""><CardTitle className="text-base font-semibold text-slate-800">Additional Information</CardTitle></CardHeader>
                            <CardContent className="text-sm">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{staff.additionalInfo}</p>
                            </CardContent>
                        </Card>
                    )}
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
                                                    <Badge variant={slip.status === 'PAID' ? 'default' : 'secondary'} className={
                                                        slip.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' :
                                                            slip.status === 'REJECTED' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' :
                                                                'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                                                    }>{slip.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {slip.status === 'PENDING' ? (
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
                                <FormField control={generateForm.control} name="month" render={({ field }) => (<FormItem><FormLabel>Month</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className='w-full'><SelectValue /></SelectTrigger></FormControl><SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
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

                            <div className="space-y-2">
                                <FormLabel>Payment Account</FormLabel>
                                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc._id} value={acc._id}>
                                                <div className="flex items-center gap-2">
                                                    {acc.type === 'BANK' ? <Landmark className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                                                    <span>{acc.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-auto">₹{acc.balance.toLocaleString()}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="flex justify-between sm:justify-between">
                                <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleInitiateRejection} disabled={sendingOtp}>
                                    {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject Payslip"}
                                </Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={!selectedAccount}>Confirm Payment</Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* OTP Rejection Dialog */}
            <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <ShieldAlert className="h-5 w-5" /> Reject Payslip
                        </DialogTitle>
                        <DialogDescription>
                            Enter the OTP sent to administrator WhatsApp to confirm rejection.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9 font-mono tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                OTP is valid for 10 minutes.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOtpOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmRejection}
                            disabled={verifyingOtp || otp.length < 6}
                        >
                            {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Staff Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                        <DialogDescription>Update employee details below.</DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleUpdateStaff)} className="space-y-4">
                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="basic">Basic</TabsTrigger>
                                    <TabsTrigger value="contact">Contact</TabsTrigger>
                                    <TabsTrigger value="job">Job Details</TabsTrigger>
                                    <TabsTrigger value="additional">Additional</TabsTrigger>
                                </TabsList>

                                {/* Basic Information Tab */}
                                <TabsContent value="basic" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={editForm.control} name="employeeId" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Employee ID *</FormLabel><FormControl><Input placeholder="EMP001" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={editForm.control} name="joinDate" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Join Date *</FormLabel><FormControl><Input type="date" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={editForm.control} name="name" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={editForm.control} name="dob" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Date of Birth *</FormLabel><FormControl><Input type="date" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={editForm.control} name="religion" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Religion</FormLabel><FormControl><Input placeholder="Optional" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={editForm.control} name="qualifications" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Qualifications</FormLabel><FormControl><Input placeholder="e.g., High School, Diploma..." {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={editForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                </TabsContent>

                                {/* Contact Details Tab */}
                                <TabsContent value="contact" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={editForm.control} name="phone" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Phone *</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={editForm.control} name="email" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Address</h4>
                                        <FormField control={editForm.control} name="address.fullAddress" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Full Address</FormLabel><FormControl><Textarea placeholder="Complete address" {...fieldProps} value={String(value || '')} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={editForm.control} name="address.city" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="address.state" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={editForm.control} name="address.pincode" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Emergency Contact</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={editForm.control} name="emergencyContact.name" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input placeholder="Full name" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="emergencyContact.relationship" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="e.g., Spouse, Parent" {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={editForm.control} name="emergencyContact.phone" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Primary Phone</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={editForm.control} name="emergencyContact.alternatePhone" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Alternate Phone</FormLabel><FormControl><Input {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Job Details Tab */}
                                <TabsContent value="job" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={editForm.control} name="department" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Department *</FormLabel><FormControl><Input placeholder="Cleaning, Security..." {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={editForm.control} name="position" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Position *</FormLabel><FormControl><Input placeholder="Supervisor..." {...fieldProps} value={String(value || '')} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={editForm.control} name="baseSalary" render={({ field: { value, onChange, ...fieldProps } }) => (<FormItem><FormLabel>Monthly Salary *</FormLabel><FormControl><div className="relative"><Input type="number" className="pl-6" {...fieldProps} value={String(value || '')} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')} /><span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span></div></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={editForm.control} name="otherAllowance" render={({ field: { value, onChange, ...fieldProps } }) => (<FormItem><FormLabel>Other Allowance</FormLabel><FormControl><div className="relative"><Input type="number" className="pl-6" {...fieldProps} value={String(value || '')} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')} /><span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span></div></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={editForm.control} name="jobDescription" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Job Description / Duties & Responsibilities</FormLabel><FormControl><Textarea placeholder="Describe the role and responsibilities..." {...fieldProps} value={String(value || '')} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                                </TabsContent>

                                {/* Additional Info Tab */}
                                <TabsContent value="additional" className="space-y-4">
                                    <FormField control={editForm.control} name="additionalInfo" render={({ field: { value, ...fieldProps } }) => (<FormItem><FormLabel>Additional Information</FormLabel><FormControl><Textarea placeholder="Any other relevant information..." {...fieldProps} value={String(value || '')} rows={6} /></FormControl><FormMessage /></FormItem>)} />
                                </TabsContent>
                            </Tabs>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button type="submit">Update Staff Member</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
