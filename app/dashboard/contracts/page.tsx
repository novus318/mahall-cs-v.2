'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Building2, ArrowRight, Search, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { format } from 'date-fns';

// --- Types ---
type Contract = {
    _id: string;
    tenant: { name: string; phone: string; shopName?: string; place: string; adhaar: string };
    rooms: { _id: string; roomNumber: string; building: string }[];
    startDate: string;
    endDate: string;
    rentAmount: number;
    depositAmount: number;
    status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
};

type BuildingWithRooms = {
    _id: string;
    name: string;
    rooms: { _id: string; roomNumber: string; status: string }[];
};

// --- Schemas ---
const tenantSchema = z.object({
    name: z.string().min(2, "Name required"),
    phone: z.string().min(10, "Valid phone required"),
    adhaar: z.string().min(12, "Valid Aadhaar required"),
    place: z.string().min(2, "Place required"),
    shopName: z.string().optional(),
});

const financeSchema = z.object({
    startDate: z.string().min(1, "Start date required"),
    endDate: z.string().min(1, "End date required"),
    rentAmount: z.coerce.number().min(1, "Rent required"),
    depositAmount: z.coerce.number().min(0, "Deposit required"),
});

type FinanceValues = z.infer<typeof financeSchema>;

export default function ContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<BuildingWithRooms[]>([]);

    // Filters & Pagination
    const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'HISTORY'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [buildingFilter, setBuildingFilter] = useState('ALL');

    // Wizard State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

    // Forms
    const tenantForm = useForm<z.infer<typeof tenantSchema>>({ resolver: zodResolver(tenantSchema), defaultValues: { name: '', phone: '', adhaar: '', place: '', shopName: '' } });
    const financeForm = useForm<FinanceValues>({ resolver: zodResolver(financeSchema) as any, defaultValues: { startDate: '', endDate: '', rentAmount: 0, depositAmount: 0 } });

    useEffect(() => {
        fetchBuildings();
    }, []);

    useEffect(() => {
        // Debounce search? Or just simple effect for now
        const timer = setTimeout(() => {
            fetchContracts();
        }, 300);
        return () => clearTimeout(timer);
    }, [activeTab, page, searchQuery, buildingFilter]);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit: 10,
                status: activeTab,
            };
            if (searchQuery) params.search = searchQuery;
            if (buildingFilter && buildingFilter !== 'ALL') params.building = buildingFilter;

            const { data } = await api.get('/contracts', { params });
            setContracts(data.contracts);
            setTotalPages(data.totalPages);
        } catch (error) { toast.error("Failed to load contracts"); }
        finally { setLoading(false); }
    };

    const fetchBuildings = async () => {
        try {
            const { data } = await api.get('/buildings');
            setBuildings(data);
        } catch (error) { toast.error("Failed to load buildings"); }
    };

    // Wizard Handlers
    const handleCreateContract = async () => {
        const tenantData = tenantForm.getValues();
        const financeData = financeForm.getValues();
        if (selectedRoomIds.length === 0) return toast.error("Select at least one unit");

        const payload = {
            tenant: tenantData,
            roomIds: selectedRoomIds,
            ...financeData
        };

        try {
            await api.post('/contracts', payload);
            toast.success("Contract created");
            setIsCreateOpen(false);
            resetWizard();
            // If on active tab, refresh. If history, user might need to switch. 
            if (activeTab === 'ACTIVE') fetchContracts();
            else setActiveTab('ACTIVE');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Creation failed");
        }
    };

    const resetWizard = () => {
        setStep(1);
        setSelectedRoomIds([]);
        tenantForm.reset();
        financeForm.reset();
    };

    const openWizard = () => {
        fetchBuildings(); // Ensure fresh room status
        setIsCreateOpen(true);
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)] overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Contracts</h2>
                    <p className="text-muted-foreground text-sm">Manage rental agreements and tenants.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openWizard} size="sm" className="h-8">
                        <Plus className="mr-2 h-3.5 w-3.5" /> New Contract
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 items-end sm:items-center">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                        <TabsTrigger value="HISTORY">History</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 flex-1 w-full">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tenants..."
                            className="pl-9 h-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        />
                    </div>
                    <Select value={buildingFilter} onValueChange={(v) => { setBuildingFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                            <SelectValue placeholder="Filter Building" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Buildings</SelectItem>
                            {buildings.map(b => (
                                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table View */}
            <div className="flex-1 border rounded-md overflow-hidden bg-background flex flex-col">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                            <TableRow className="pointer-events-none hover:bg-transparent">
                                <TableHead className="w-[200px] text-xs font-semibold h-9">Tenant</TableHead>
                                <TableHead className="text-xs font-semibold h-9">Contact</TableHead>
                                <TableHead className="text-xs font-semibold h-9">Units</TableHead>
                                <TableHead className="text-xs font-semibold h-9 text-right">Rent</TableHead>
                                <TableHead className="text-xs font-semibold h-9 text-right">Start Date</TableHead>
                                <TableHead className="text-xs font-semibold h-9 text-right">End Date</TableHead>
                                <TableHead className="text-xs font-semibold h-9 text-center w-[100px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                            ) : contracts.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">No contracts found.</TableCell></TableRow>
                            ) : (
                                contracts.map((contract) => (
                                    <TableRow
                                        key={contract._id}
                                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors h-10"
                                        onClick={() => router.push(`/dashboard/contracts/${contract._id}`)}
                                    >
                                        <TableCell className="font-medium text-xs py-2">
                                            <div>{contract.tenant.name}</div>
                                            {contract.tenant.shopName && <div className="text-[10px] text-muted-foreground">{contract.tenant.shopName}</div>}
                                        </TableCell>
                                        <TableCell className="text-xs py-2 text-muted-foreground">{contract.tenant.phone}</TableCell>
                                        <TableCell className="text-xs py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {contract.rooms.map(r => (
                                                    <span key={r._id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {r.roomNumber}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs py-2 text-right font-mono">₹{contract.rentAmount}</TableCell>
                                        <TableCell className="text-xs py-2 text-right text-muted-foreground">{format(new Date(contract.startDate), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="text-xs py-2 text-right text-muted-foreground">{format(new Date(contract.endDate), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="text-xs py-2 text-center">
                                            <Badge variant={contract.status === 'ACTIVE' ? 'default' : 'secondary'} className={`text-[10px] h-5 px-1.5 font-normal border-0 ${contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                contract.status === 'TERMINATED' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''
                                                }`}>
                                                {contract.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 p-2 border-t text-xs">
                    <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Creation Wizard (Unchanged Logic - Reusing same component Block) */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetWizard(); setIsCreateOpen(open); }}>
                <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>New Rental Contract</DialogTitle>
                        <DialogDescription>Step {step} of 3</DialogDescription>
                        <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full bg-primary transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 pt-2">
                        {step === 1 && (
                            <Form {...tenantForm}>
                                <form className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField control={tenantForm.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Tenant Name</FormLabel><FormControl><Input className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={tenantForm.control} name="phone" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Phone</FormLabel><FormControl><Input className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={tenantForm.control} name="adhaar" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Aadhaar No.</FormLabel><FormControl><Input className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={tenantForm.control} name="shopName" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Shop Name (Optional)</FormLabel><FormControl><Input className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={tenantForm.control} name="place" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Address/Place</FormLabel><FormControl><Input className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </form>
                            </Form>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Select Units</h4>
                                {buildings.map(b => {
                                    const vacantRooms = b.rooms.filter(r => r.status === 'VACANT');
                                    if (vacantRooms.length === 0) return null;
                                    return (
                                        <div key={b._id} className="border rounded-md p-3">
                                            <div className="text-xs font-bold text-muted-foreground mb-2">{b.name}</div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {vacantRooms.map(r => (
                                                    <div key={r._id}
                                                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedRoomIds.includes(r._id) ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50'}`}
                                                        onClick={() => {
                                                            setSelectedRoomIds(prev => prev.includes(r._id) ? prev.filter(id => id !== r._id) : [...prev, r._id]);
                                                        }}
                                                    >
                                                        <Checkbox checked={selectedRoomIds.includes(r._id)} />
                                                        <span className="text-xs font-mono">{r.roomNumber}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {buildings.every(b => b.rooms.filter(r => r.status === 'VACANT').length === 0) && (
                                    <div className="text-center text-sm text-muted-foreground py-10">No vacant units available.</div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <Form {...financeForm}>
                                <form className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField<FinanceValues> control={financeForm.control} name="startDate" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Start Date</FormLabel><FormControl><Input type="date" className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField<FinanceValues> control={financeForm.control} name="endDate" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">End Date</FormLabel><FormControl><Input type="date" className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField<FinanceValues> control={financeForm.control} name="rentAmount" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Monthly Rent (Total)</FormLabel><FormControl><Input type="number" className="h-8 text-xs font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField<FinanceValues> control={financeForm.control} name="depositAmount" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Security Deposit</FormLabel><FormControl><Input type="number" className="h-8 text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>

                                    <div className="mt-4 p-3 bg-slate-50 border rounded-md text-xs space-y-1">
                                        <div className="font-semibold text-muted-foreground">Summary</div>
                                        <div className="flex justify-between"><span>Tenant:</span> <span className="font-medium">{tenantForm.watch('name')}</span></div>
                                        <div className="flex justify-between"><span>Units:</span> <span className="font-medium">{selectedRoomIds.length} Selected</span></div>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t bg-slate-50/50">
                        {step > 1 && (
                            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>Back</Button>
                        )}
                        {step < 3 ? (
                            <Button size="sm" onClick={async () => {
                                if (step === 1) {
                                    const valid = await tenantForm.trigger();
                                    if (valid) setStep(2);
                                } else if (step === 2) {
                                    if (selectedRoomIds.length > 0) setStep(3);
                                    else toast.error("Select at least one unit");
                                }
                            }}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button size="sm" onClick={financeForm.handleSubmit(handleCreateContract)}>Create Contract</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
