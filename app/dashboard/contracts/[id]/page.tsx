'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, CreditCard, User, Building2, Trash2, Plus, Loader2, AlertTriangle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/axios';

// --- Types ---
type Contract = {
    _id: string;
    tenant: { name: string; phone: string; shopName?: string; place: string; adhaar: string };
    rooms: { _id: string; roomNumber: string; building: string; status: string }[];
    startDate: string;
    endDate: string;
    rentAmount: number;
    depositAmount: number;
    depositCollected?: number;
    depositReturned?: number;
    status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
};

type RentDue = {
    _id: string;
    monthYear: string;
    amount: number;
    collectedAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID';
    paymentDate?: string;
    notes?: string;
    transactions?: { amount: number; date: string; notes?: string; receipt?: { _id: string; receiptNo: string } | null }[];
};

type DepositTx = {
    _id: string;
    amount: number;
    type: 'DEPOSIT' | 'REFUND';
    paymentDate: string;
    receipt?: { _id: string; receiptNo: string } | null;
};

const RentRow = ({ rent, isActive, onCollect }: { rent: RentDue, isActive: boolean, onCollect: (id: string, due: number) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasHistory = rent.transactions && rent.transactions.length > 0;

    return (
        <>
            <TableRow className="h-9 group hover:bg-muted/50">
                <TableCell className="text-xs py-1 font-mono font-medium">
                    <div className="flex items-center gap-2">
                        {hasHistory && (
                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setIsOpen(!isOpen)}>
                                {isOpen ? <div className="h-0 w-0 border-x-4 border-x-transparent border-t-[6px] border-t-current" /> : <div className="h-0 w-0 border-y-4 border-y-transparent border-l-[6px] border-l-current" />}
                            </Button>
                        )}
                        {rent.monthYear}
                    </div>
                </TableCell>
                <TableCell className="text-xs py-1">₹{rent.amount}</TableCell>
                <TableCell className="text-xs py-1 text-green-600">
                    <div>₹{rent.collectedAmount}</div>
                    <div className="text-[10px] text-muted-foreground">
                        Bal: ₹{rent.amount - rent.collectedAmount}
                    </div>
                </TableCell>
                <TableCell className="text-xs py-1">
                    <Badge variant={rent.status === 'PAID' ? 'default' : rent.status === 'PARTIAL' ? 'secondary' : 'destructive'}
                        className={`text-[10px] uppercase font-normal h-5 border-0 ${rent.status === 'PAID' ? 'bg-green-100 text-green-700' : rent.status === 'PENDING' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {rent.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-xs py-1 text-right">
                    {rent.status !== 'PAID' && isActive && (
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onCollect(rent._id, rent.amount - rent.collectedAmount)}>
                            <CreditCard className="h-3 w-3" />
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            {isOpen && hasHistory && (
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableCell colSpan={5} className="p-0 border-b">
                        <div className="pl-8 pr-4 py-2">
                            <div className="text-[10px] font-semibold text-muted-foreground mb-1">Transaction History</div>
                            <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1 border rounded bg-white p-1">
                                {rent.transactions?.map((tx, idx) => (
                                    <div key={idx} className="flex justify-between items-center px-2 py-1.5 text-xs border-b last:border-0 hover:bg-slate-50">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">Payment #{idx + 1}</span>
                                            <span className="text-[10px] text-muted-foreground">{format(new Date(tx.date), 'dd MMM yyyy')} • {tx.notes || 'No notes'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-mono font-bold text-green-700">+₹{tx.amount}</div>
                                            {tx.receipt && (
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => window.open(`https://api.tmj.org.in/api/receipts/${tx.receipt!._id}/pdf`, '_blank')}>
                                                    <FileText className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [rents, setRents] = useState<RentDue[]>([]);
    const [deposits, setDeposits] = useState<DepositTx[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isTerminating, setIsTerminating] = useState(false);
    const [isGeneratingRent, setIsGeneratingRent] = useState(false);
    const [isCollectingRent, setIsCollectingRent] = useState(false);
    const [isCollectingDeposit, setIsCollectingDeposit] = useState(false);

    // Dialog States
    const [isRentGenOpen, setIsRentGenOpen] = useState(false);
    const [isCollectRentOpen, setIsCollectRentOpen] = useState(false);
    const [selectedRentId, setSelectedRentId] = useState<string | null>(null);
    const [isCollectDepositOpen, setIsCollectDepositOpen] = useState(false);
    const [isTerminateOpen, setIsTerminateOpen] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        'tenant.name': '',
        'tenant.phone': '',
        'tenant.adhaar': '',
        'tenant.place': '',
        'tenant.shopName': '',
        endDate: '',
        rentAmount: 0
    });

    // Rent Gen Form State
    const [rentGenForm, setRentGenForm] = useState({
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        amount: 0
    });

    // Collect Rent Form State
    const [collectRentForm, setCollectRentForm] = useState({
        amount: 0,
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Collect Deposit Form State
    const [collectDepositForm, setCollectDepositForm] = useState({
        amount: 0,
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Terminate Form State
    const [terminateForm, setTerminateForm] = useState({
        returnAmount: 0,
        accountId: '',
        confirm: false
    });

    useEffect(() => {
        if (resolvedParams.id) fetchData();
    }, [resolvedParams.id]);

    useEffect(() => {
        if (isRentGenOpen && contract) {
            setRentGenForm(prev => ({ ...prev, amount: contract.rentAmount }));
        }
    }, [isRentGenOpen, contract]);

    useEffect(() => {
        if (isCollectDepositOpen && contract) {
            const remaining = contract.depositAmount - (contract.depositCollected || 0);
            setCollectDepositForm(prev => ({ ...prev, amount: remaining > 0 ? remaining : contract.depositAmount }));
        }
    }, [isCollectDepositOpen, contract]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contractRes, financialsRes] = await Promise.all([
                api.get(`/contracts/${resolvedParams.id}`),
                api.get(`/contracts/${resolvedParams.id}/financials`)
            ]);
            setContract(contractRes.data);
            setRents(financialsRes.data.rents);
            setDeposits(financialsRes.data.deposits);

            api.get('/accounts').then(res => setAccounts(res.data.data)).catch(console.error);

            setEditForm({
                'tenant.name': contractRes.data.tenant.name,
                'tenant.phone': contractRes.data.tenant.phone,
                'tenant.adhaar': contractRes.data.tenant.adhaar,
                'tenant.place': contractRes.data.tenant.place,
                'tenant.shopName': contractRes.data.tenant.shopName || '',
                endDate: contractRes.data.endDate.split('T')[0],
                rentAmount: contractRes.data.rentAmount,
            });

        } catch (error) { toast.error("Failed to load details"); }
        finally { setLoading(false); }
    };

    const handleUpdate = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        const payload = {
            tenant: {
                name: editForm['tenant.name'],
                phone: editForm['tenant.phone'],
                adhaar: editForm['tenant.adhaar'],
                place: editForm['tenant.place'],
                shopName: editForm['tenant.shopName'] || '',
            },
            endDate: editForm.endDate,
            rentAmount: editForm.rentAmount,
        };
        try {
            const response = await api.put(`/contracts/${resolvedParams.id}`, payload);
            const updatedContract = response.data;

            setContract(updatedContract);

            setEditForm({
                'tenant.name': updatedContract.tenant.name,
                'tenant.phone': updatedContract.tenant.phone,
                'tenant.adhaar': updatedContract.tenant.adhaar,
                'tenant.place': updatedContract.tenant.place,
                'tenant.shopName': updatedContract.tenant.shopName || '',
                endDate: updatedContract.endDate.split('T')[0],
                rentAmount: updatedContract.rentAmount,
            });

            toast.success("Contract updated");
            setIsEditMode(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleGenerateRent = async () => {
        if (isGeneratingRent) return;
        setIsGeneratingRent(true);
        try {
            await api.post(`/contracts/${resolvedParams.id}/rents`, rentGenForm);
            toast.success("Rent invoice generated");
            setIsRentGenOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Generation failed");
        } finally {
            setIsGeneratingRent(false);
        }
    };

    const handleCollectRent = async () => {
        if (!selectedRentId || isCollectingRent) return;
        setIsCollectingRent(true);
        try {
            await api.put(`/contracts/${resolvedParams.id}/rents/${selectedRentId}/pay`, collectRentForm);
            toast.success("Payment collected");
            setIsCollectRentOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Collection failed");
        } finally {
            setIsCollectingRent(false);
        }
    };

    const handleCollectDeposit = async () => {
        if (isCollectingDeposit) return;
        setIsCollectingDeposit(true);
        try {
            await api.post(`/contracts/${resolvedParams.id}/deposit/collect`, collectDepositForm);
            toast.success("Deposit collected successfully");
            setIsCollectDepositOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Collection failed");
        } finally {
            setIsCollectingDeposit(false);
        }
    };

    const handleTerminate = async () => {
        if (isTerminating) return;
        setIsTerminating(true);
        try {
            const payload: any = {
                returnAmount: terminateForm.returnAmount || 0,
            };

            if (Number(terminateForm.returnAmount) > 0 && terminateForm.accountId) {
                payload.accountId = terminateForm.accountId;
            }

            await api.put(`/contracts/${resolvedParams.id}/terminate`, payload);
            toast.success("Contract terminated");
            setIsTerminateOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to terminate");
        } finally {
            setIsTerminating(false);
        }
    };

    // Calculations
    const totalDepositPaid = deposits.filter(p => p.type === 'DEPOSIT').reduce((acc, curr) => acc + curr.amount, 0);
    const totalRefunds = deposits.filter(p => p.type === 'REFUND').reduce((acc, curr) => acc + curr.amount, 0);
    const depositHeld = totalDepositPaid - totalRefunds;
    const isDepositSettled = depositHeld >= (contract?.depositAmount || 0);

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    if (!contract) return <div>Contract not found</div>;
    const isActive = contract.status === 'ACTIVE';

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            {contract.tenant.name}
                            <Badge variant={isActive ? 'default' : 'destructive'} className="text-[10px] h-5 px-1.5">{contract.status}</Badge>
                        </h2>
                        <div className="text-muted-foreground text-xs flex items-center gap-2">
                            <span className="font-mono">{contract.rooms.map(r => r.roomNumber).join(', ')}</span> • {contract.tenant.phone}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isActive ? (
                        <>
                            {isEditMode ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        if (contract) {
                                            setEditForm({
                                                'tenant.name': contract.tenant.name,
                                                'tenant.phone': contract.tenant.phone,
                                                'tenant.adhaar': contract.tenant.adhaar,
                                                'tenant.place': contract.tenant.place,
                                                'tenant.shopName': contract.tenant.shopName || '',
                                                endDate: contract.endDate.split('T')[0],
                                                rentAmount: contract.rentAmount,
                                            });
                                        }
                                        setIsEditMode(false);
                                    }} disabled={isUpdating}>Cancel</Button>
                                    <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isUpdating ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => {
                                        if (contract) {
                                            setEditForm({
                                                'tenant.name': contract.tenant.name,
                                                'tenant.phone': contract.tenant.phone,
                                                'tenant.adhaar': contract.tenant.adhaar,
                                                'tenant.place': contract.tenant.place,
                                                'tenant.shopName': contract.tenant.shopName || '',
                                                endDate: contract.endDate.split('T')[0],
                                                rentAmount: contract.rentAmount,
                                            });
                                        }
                                        setIsEditMode(true);
                                    }}>
                                        <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                                    </Button>
                                    <Button variant="destructive" size="sm" className="h-8" onClick={() => { setTerminateForm(prev => ({ ...prev, returnAmount: depositHeld > 0 ? depositHeld : 0 })); setIsTerminateOpen(true); }}>
                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Terminate
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-muted-foreground">
                            <AlertTriangle className="h-3 w-3" /> Contract Ended
                        </div>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-8 pb-10 max-w-6xl mx-auto">

                    {/* --- DETAILS SECTION --- */}
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="shadow-none border h-full">
                                <CardHeader className="py-3 px-4 bg-slate-50 border-b"><CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Tenant Details</CardTitle></CardHeader>
                                <CardContent className="p-4 grid grid-cols-1 gap-4">
                                    {isEditMode ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><div className="text-xs mb-1">Name</div><Input className="h-8 text-xs" value={editForm['tenant.name']} onChange={e => setEditForm(prev => ({ ...prev, 'tenant.name': e.target.value }))} /></div>
                                                <div><div className="text-xs mb-1">Phone</div><Input className="h-8 text-xs" value={editForm['tenant.phone']} onChange={e => setEditForm(prev => ({ ...prev, 'tenant.phone': e.target.value }))} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><div className="text-xs mb-1">Aadhaar</div><Input className="h-8 text-xs" value={editForm['tenant.adhaar']} onChange={e => setEditForm(prev => ({ ...prev, 'tenant.adhaar': e.target.value }))} /></div>
                                                <div><div className="text-xs mb-1">Shop Name</div><Input className="h-8 text-xs" value={editForm['tenant.shopName']} onChange={e => setEditForm(prev => ({ ...prev, 'tenant.shopName': e.target.value }))} /></div>
                                            </div>
                                            <div><div className="text-xs mb-1">Address</div><Input className="h-8 text-xs" value={editForm['tenant.place']} onChange={e => setEditForm(prev => ({ ...prev, 'tenant.place': e.target.value }))} /></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><div className="text-xs text-muted-foreground mb-1">Name</div><div className="text-xs font-medium">{contract.tenant.name}</div></div>
                                                <div><div className="text-xs text-muted-foreground mb-1">Phone</div><div className="text-xs font-medium">{contract.tenant.phone}</div></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><div className="text-xs text-muted-foreground mb-1">Aadhaar</div><div className="text-xs font-medium">{contract.tenant.adhaar}</div></div>
                                                <div><div className="text-xs text-muted-foreground mb-1">Shop Name</div><div className="text-xs font-medium">{contract.tenant.shopName || '-'}</div></div>
                                            </div>
                                            <div><div className="text-xs text-muted-foreground mb-1">Address</div><div className="text-xs font-medium">{contract.tenant.place}</div></div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="shadow-none border h-full">
                                <CardHeader className="py-3 px-4 bg-slate-50 border-b"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Contract Terms</CardTitle></CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><div className="text-xs">Monthly Rent</div><Input type="number" disabled={!isEditMode} className="h-8 text-xs font-bold" value={editForm.rentAmount} onChange={e => setEditForm(prev => ({ ...prev, rentAmount: Number(e.target.value) }))} /></div>
                                        <div><div className="text-xs">End Date</div><Input type="date" disabled={!isEditMode} className="h-8 text-xs" value={editForm.endDate} onChange={e => setEditForm(prev => ({ ...prev, endDate: e.target.value }))} /></div>
                                    </div>
                                        <div className="text-xs space-y-2">
                                            <div className="flex justify-between"><span>Start Date:</span> <span className="font-mono">{format(new Date(contract.startDate), 'dd MMM yyyy')}</span></div>

                                            <div className="bg-slate-50 rounded border overflow-hidden">
                                                <div className="flex justify-between items-center p-2">
                                                    <span>Security Deposit:</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold">₹{contract.depositAmount}</span>
                                                        {isDepositSettled ? (
                                                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Collected</Badge>
                                                        ) : (
                                                            <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 p-2" onClick={() => setIsCollectDepositOpen(true)} disabled={!isActive}>Collect Now</Button>
                                                        )}
                                                    </div>
                                                </div>
                                                {deposits.length > 0 && (
                                                    <div className="border-t bg-muted/20 p-2 space-y-1">
                                                        {deposits.map(d => (
                                                            <div key={d._id} className="flex justify-between items-center text-[10px] text-muted-foreground">
                                                                <span className="flex items-center gap-1.5">
                                                                    {d.type === 'DEPOSIT' ? <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                                                    {d.type === 'DEPOSIT' ? 'Collected' : 'Refunded'} on {format(new Date(d.paymentDate), 'dd MMM yyyy')}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono">{d.type === 'REFUND' ? '-' : ''}₹{d.amount}</span>
                                                                    {d.receipt && (
                                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => window.open(`https://api.tmj.org.in/api/receipts/${d.receipt!._id}/pdf`, '_blank')}>
                                                                            <FileText className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                        <Separator />
                                        <div>
                                            <div className="text-xs font-semibold mb-2">Allocated Units</div>
                                            <div className="flex flex-wrap gap-2">
                                                {contract.rooms.map(r => (<div key={r._id} className="border rounded px-3 py-1 text-xs bg-slate-50 flex items-center gap-2"><Building2 className="h-3 w-3 text-muted-foreground" /><span className="font-mono">{r.roomNumber}</span></div>))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    <Separator />

                    {/* --- RENTS SECTION --- */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight">Monthly Rent</h3>
                                <p className="text-sm text-muted-foreground">Generate and track monthly rent invoices</p>
                            </div>
                            <Button size="sm" className="h-8 text-xs" onClick={() => setIsRentGenOpen(true)} disabled={!isActive}>
                                <Plus className="mr-1 h-3 w-3" /> Generate Rent
                            </Button>
                        </div>

                        <div className="border rounded bg-background overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="h-8 text-xs">Month-Year</TableHead>
                                        <TableHead className="h-8 text-xs">Due Amount</TableHead>
                                        <TableHead className="h-8 text-xs">Collected</TableHead>
                                        <TableHead className="h-8 text-xs">Status</TableHead>
                                        <TableHead className="h-8 text-xs text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rents.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">No rent invoices generated.</TableCell></TableRow>
                                    ) : (
                                        rents.map(r => (
                                            <RentRow
                                                key={r._id}
                                                rent={r}
                                                isActive={isActive}
                                                onCollect={(id, due) => {
                                                    setSelectedRentId(id);
                                                    setCollectRentForm({ amount: due, accountId: '', date: new Date().toISOString().split('T')[0], notes: '' });
                                                    setIsCollectRentOpen(true);
                                                }}
                                            />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                </div>
            </ScrollArea>

            {/* --- DIALOGS --- */}

            {/* Generate Rent */}
            <Dialog open={isRentGenOpen} onOpenChange={(open) => !isGeneratingRent && setIsRentGenOpen(open)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader><DialogTitle>Generate Rent Invoice</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><div className="text-xs">Month</div><Select value={rentGenForm.month} onValueChange={v => setRentGenForm(p => ({ ...p, month: v }))}><SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent></Select></div>
                            <div><div className="text-xs">Year</div><Input className="h-8 text-xs" value={rentGenForm.year} onChange={e => setRentGenForm(p => ({ ...p, year: e.target.value }))} /></div>
                        </div>
                        <div><div className="text-xs">Rent Amount</div><Input type="number" className="h-8 text-xs font-bold" value={rentGenForm.amount} onChange={e => setRentGenForm(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                        <DialogFooter>
                            <Button type="button" size="sm" disabled={isGeneratingRent} onClick={handleGenerateRent}>
                                {isGeneratingRent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isGeneratingRent ? "Generating..." : "Generate"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Collect Rent */}
            <Dialog open={isCollectRentOpen} onOpenChange={(open) => !isCollectingRent && setIsCollectRentOpen(open)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Collect Rent Payment</DialogTitle>
                        {selectedRentId && rents.find(r => r._id === selectedRentId) && (
                            <DialogDescription className="text-xs">
                                Balance Pending: <span className="font-bold text-foreground">₹{rents.find(r => r._id === selectedRentId)!.amount - rents.find(r => r._id === selectedRentId)!.collectedAmount}</span>
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="space-y-4">
                        <div><div className="text-xs">Amount Received</div><Input type="number" className="h-8 text-xs font-bold" value={collectRentForm.amount} onChange={e => setCollectRentForm(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                        <div><div className="text-xs">Deposit To Account</div><Select value={collectRentForm.accountId} onValueChange={v => setCollectRentForm(p => ({ ...p, accountId: v }))}><SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Select Account" /></SelectTrigger><SelectContent>{accounts.map(acc => (<SelectItem key={acc._id} value={acc._id}>{acc.name} ({acc.type})</SelectItem>))}</SelectContent></Select></div>
                        <div><div className="text-xs">Date</div><Input type="date" className="h-8 text-xs" value={collectRentForm.date} onChange={e => setCollectRentForm(p => ({ ...p, date: e.target.value }))} /></div>
                        <div><div className="text-xs">Notes</div><Input className="h-8 text-xs" value={collectRentForm.notes} onChange={e => setCollectRentForm(p => ({ ...p, notes: e.target.value }))} /></div>
                        <DialogFooter>
                            <Button type="button" size="sm" disabled={isCollectingRent || !collectRentForm.accountId} onClick={handleCollectRent}>
                                {isCollectingRent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isCollectingRent ? "Recording..." : "Record Payment"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
                                   

            {/* Collect Deposit */}
            <Dialog open={isCollectDepositOpen} onOpenChange={(open) => !isCollectingDeposit && setIsCollectDepositOpen(open)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Collect Security Deposit</DialogTitle>
                        {contract && (
                            <DialogDescription className="text-xs">
                                Total Deposit: <span className="font-bold text-foreground">₹{contract.depositAmount}</span>
                                {contract.depositCollected && contract.depositCollected > 0 && (
                                    <> • Remaining: <span className="font-bold text-orange-600">₹{contract.depositAmount - contract.depositCollected}</span></>
                                )}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="space-y-4">
                        <div><div className="text-xs">Amount Collected</div><Input type="number" className="h-8 text-xs font-bold" value={collectDepositForm.amount} onChange={e => setCollectDepositForm(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                        <div><div className="text-xs">Deposit To Account</div><Select value={collectDepositForm.accountId} onValueChange={v => setCollectDepositForm(p => ({ ...p, accountId: v }))}><SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Select Account" /></SelectTrigger><SelectContent>{accounts.map(acc => (<SelectItem key={acc._id} value={acc._id}>{acc.name} ({acc.type})</SelectItem>))}</SelectContent></Select></div>
                        <div><div className="text-xs">Date</div><Input type="date" className="h-8 text-xs" value={collectDepositForm.date} onChange={e => setCollectDepositForm(p => ({ ...p, date: e.target.value }))} /></div>
                        <div><div className="text-xs">Notes</div><Input className="h-8 text-xs" value={collectDepositForm.notes} onChange={e => setCollectDepositForm(p => ({ ...p, notes: e.target.value }))} /></div>
                        <DialogFooter>
                            <Button type="button" size="sm" disabled={isCollectingDeposit || !collectDepositForm.accountId} onClick={handleCollectDeposit}>
                                {isCollectingDeposit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isCollectingDeposit ? "Recording..." : "Record Deposit Collection"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Termination */}
            <Dialog open={isTerminateOpen} onOpenChange={(open) => !isTerminating && setIsTerminateOpen(open)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Terminate Contract</DialogTitle>
                        <DialogDescription>
                            Action is <strong>irreversible</strong>. Room will be vacated.
                        </DialogDescription>
                    </DialogHeader>

                    <Alert variant="destructive" className="my-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription className="text-xs">
                            Ensure you have returned any remaining deposit <strong>(₹{depositHeld})</strong>. You cannot access these actions after termination.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4 mt-2">
                        {depositHeld > 0 && (
                            <div className="p-3 bg-orange-50 text-orange-800 text-xs rounded border border-orange-200">
                                You are holding <strong>₹{depositHeld}</strong>. Do you want to record a refund now?
                            </div>
                        )}

                        <div><div className="text-xs">Refund Amount (Optional - Closing Balance)</div><div className="relative"><Input type="number" className="h-9 font-bold pl-6" value={terminateForm.returnAmount} onChange={e => setTerminateForm(p => ({ ...p, returnAmount: Number(e.target.value) }))} /><span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span></div></div>

                        {terminateForm.returnAmount > 0 && (
                            <div><div className="text-xs">Refund From Account</div><Select value={terminateForm.accountId} onValueChange={v => setTerminateForm(p => ({ ...p, accountId: v }))}><SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Select Account" /></SelectTrigger><SelectContent>{accounts.map(acc => (<SelectItem key={acc._id} value={acc._id}>{acc.name} ({acc.type}) - ₹{acc.balance?.toLocaleString()}</SelectItem>))}</SelectContent></Select></div>
                        )}

                        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <input type="checkbox" checked={terminateForm.confirm} onChange={e => setTerminateForm(p => ({ ...p, confirm: e.target.checked }))} className="mt-1" />
                            <div className="space-y-1 leading-none text-sm">I confirm all dues are cleared/refunded.</div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsTerminateOpen(false)} disabled={isTerminating}>Cancel</Button>
                            <Button type="button" variant="destructive" disabled={!terminateForm.confirm || isTerminating} onClick={handleTerminate}>
                                {isTerminating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isTerminating ? "Terminating..." : "Terminate Contract"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
