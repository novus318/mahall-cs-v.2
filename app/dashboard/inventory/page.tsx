'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Package, ArrowRightLeft, ArrowLeft, Search, Filter, History, MoreHorizontal, FileText, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';

// --- Types ---
type InventoryItem = {
    _id: string;
    name: string;
    totalQuantity: number;
    availableQuantity: number;
    averageValue: number;
    rentalRate: number;
    history?: { typ: string; quantity: number; cost: number; date: string }[];
};

type Transaction = {
    _id: string;
    items: {
        itemId: { _id: string; name: string };
        quantity: number;
        rentPerUnit: number;
        amount: number;
        returnedQuantity: number;
    }[];
    typ: 'RENT_OUT' | 'USE_INTERNAL' | 'RETURN';
    customerName: string;
    customerPhone?: string;
    totalRentAmount: number;
    paidAmount?: number;
    status: 'ACTIVE' | 'PARTIAL_RETURNED' | 'RETURNED';
    issuedDate: string;
    returnedDate?: string;
    notes?: string;
};

// --- Schemas ---
const itemSchema = z.object({
    name: z.string().min(2, "Name required"),
    totalQuantity: z.coerce.number().min(1, "Quantity must be > 0"),
    averageValue: z.coerce.number().min(0, "Value required"),
    rentalRate: z.coerce.number().min(0, "Rental rate required"),
});

const editItemSchema = z.object({
    name: z.string().min(2, "Name required"),
    averageValue: z.coerce.number().min(0, "Value required"),
    rentalRate: z.coerce.number().min(0, "Rental rate required"),
});

const restockSchema = z.object({
    quantity: z.coerce.number().min(1, "Quantity must be > 0"),
    unitCost: z.coerce.number().min(0, "Unit cost required"),
});

const rentSchema = z.object({
    items: z.array(z.object({
        itemId: z.string().min(1, "Item required"),
        quantity: z.coerce.number().min(1, "Quantity must be > 0"),
        rentPerUnit: z.coerce.number().min(0, "Rent required")
    })).min(1, "At least one item is required"),
    typ: z.enum(['RENT_OUT', 'USE_INTERNAL']),
    customerName: z.string().min(1, "Customer name required"),
    customerPhone: z.string().optional(),
    notes: z.string().optional(),
});

const damageSchema = z.object({
    quantity: z.coerce.number().min(1, "Quantity must be > 0"),
    notes: z.string().optional(),
});

const returnSchema = z.object({
    amountPaid: z.coerce.number().min(0),
    accountId: z.string().optional(),
});

const PAGE_SIZE = 5;

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState('items');

    // Items State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [itemsPage, setItemsPage] = useState(1);
    const [itemsTotalPages, setItemsTotalPages] = useState(1);
    const [itemsTotal, setItemsTotal] = useState(0);
    const [itemsSearch, setItemsSearch] = useState('');
    const [itemsLoading, setItemsLoading] = useState(false);
    const [allItems, setAllItems] = useState<InventoryItem[]>([]); // Full list for dropdowns

    // Transactions State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [txMainPage, setTxMainPage] = useState(1); // Page for main transaction list
    const [txMainTotalPages, setTxMainTotalPages] = useState(1);
    const [transactionsLoading, setTransactionsLoading] = useState(false);


    // Item History State (Sheet)
    const [selectedItemHistory, setSelectedItemHistory] = useState<InventoryItem | null>(null);
    const [itemTransactions, setItemTransactions] = useState<Transaction[]>([]);
    const [restockHistory, setRestockHistory] = useState<any[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Server Pagination State for Sheet
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [restockPage, setRestockPage] = useState(1);
    const [restockTotalPages, setRestockTotalPages] = useState(1);

    // Dialog States
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [isRentOpen, setIsRentOpen] = useState(false);
    const [isDamageOpen, setIsDamageOpen] = useState(false);
    const [isReturnOpen, setIsReturnOpen] = useState(false);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);

    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedReturnTx, setSelectedReturnTx] = useState<Transaction | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Ledger State
    const [ledgerData, setLedgerData] = useState<{ payments: any[], receipt: any | null }>({ payments: [], receipt: null });

    // All Rentals State
    const [allRentals, setAllRentals] = useState<Transaction[]>([]);
    const [allRentalsLoading, setAllRentalsLoading] = useState(false);
    const [allRentalsPage, setAllRentalsPage] = useState(1);
    const [allRentalsTotalPages, setAllRentalsTotalPages] = useState(1);

    // Loading States
    const [isSubmittingAddItem, setIsSubmittingAddItem] = useState(false);
    const [isSubmittingEditItem, setIsSubmittingEditItem] = useState(false);
    const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);
    const [isSubmittingRent, setIsSubmittingRent] = useState(false);
    const [isSubmittingDamage, setIsSubmittingDamage] = useState(false);
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Forms
    const addItemForm = useForm<z.infer<typeof itemSchema>>({ resolver: zodResolver(itemSchema) as any, defaultValues: { name: '', totalQuantity: 1, averageValue: 0, rentalRate: 0 } });
    const editItemForm = useForm<z.infer<typeof editItemSchema>>({ resolver: zodResolver(editItemSchema) as any, defaultValues: { name: '', averageValue: 0, rentalRate: 0 } });
    const restockForm = useForm<z.infer<typeof restockSchema>>({ resolver: zodResolver(restockSchema) as any, defaultValues: { quantity: 1, unitCost: 0 } });
    const rentForm = useForm<z.infer<typeof rentSchema>>({ resolver: zodResolver(rentSchema) as any, defaultValues: { items: [{ itemId: '', quantity: 1, rentPerUnit: 0 }], typ: 'RENT_OUT', customerName: '', customerPhone: '', notes: '' } });
    const { fields: rentItems, append: appendRentItem, remove: removeRentItem } = useFieldArray({ control: rentForm.control, name: "items" });
    const rentFormType = rentForm.watch('typ');
    const rentFormItems = rentForm.watch('items');

    const damageForm = useForm<z.infer<typeof damageSchema>>({ resolver: zodResolver(damageSchema) as any, defaultValues: { quantity: 1, notes: '' } });
    const returnForm = useForm<z.infer<typeof returnSchema>>({ resolver: zodResolver(returnSchema) as any, defaultValues: { amountPaid: 0, accountId: '' } });

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchItems();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [itemsSearch, itemsPage]);

    // Load Transactions when tab changes
    useEffect(() => {
        if (activeTab === 'rentals') fetchActiveTransactions();
        if (activeTab === 'history') fetchAllRentals();
    }, [activeTab, txMainPage, allRentalsPage]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const { data } = await api.get('/accounts');
                setAccounts(data.data || []);
            } catch (e) { }
        };
        fetchAccounts();
    }, []);

    const fetchItems = async () => {
        setItemsLoading(true);
        try {
            const { data } = await api.get(`/inventory/items?page=${itemsPage}&limit=10&search=${itemsSearch}`);
            if (data.status) {
                setItems(data.data);
                setItemsTotalPages(data.pagination.pages);
                setItemsTotal(data.pagination.total);
            }
        } catch (error) { toast.error("Failed to load inventory"); }
        finally { setItemsLoading(false); fetchAllItems(); }
    };

    const fetchAllItems = async () => {
        try {
            const { data } = await api.get(`/inventory/items?all=true`);
            if (data.status) {
                setAllItems(data.data);
            }
        } catch (error) { console.error("Failed to fetch all items"); }
    };

    useEffect(() => {
        fetchAllItems();
    }, []);

    const fetchActiveTransactions = async () => {
        setTransactionsLoading(true);
        try {
            const { data } = await api.get(`/inventory/transactions?page=${txMainPage}&limit=10`);
            setTransactions(data.data);
            setTxMainTotalPages(data.pagination.pages);
        } catch (error) { toast.error("Failed to load rentals"); }
        finally { setTransactionsLoading(false); }
    };

    const fetchAllRentals = async () => {
        setAllRentalsLoading(true);
        try {
            const { data } = await api.get(`/inventory/transactions?all=true&page=${allRentalsPage}&limit=10`);
            setAllRentals(data.data);
            setAllRentalsTotalPages(data.pagination.pages);
        } catch (error) { toast.error("Failed to load rental history"); }
        finally { setAllRentalsLoading(false); }
    };

    // Open History & Fetch First Page
    const openItemHistory = async (item: InventoryItem) => {
        setSelectedItemHistory(item);
        setIsSheetOpen(true);
        setTxPage(1);
        setRestockPage(1);
        fetchHistoryTransactions(item._id, 1);
        fetchRestockHistory(item._id, 1);
    };

    const fetchHistoryTransactions = async (itemId: string, page: number) => {
        try {
            const { data } = await api.get(`/inventory/transactions?all=true&itemId=${itemId}&page=${page}&limit=${PAGE_SIZE}`);
            setItemTransactions(data.data);
            setTxTotalPages(data.pagination.pages);
        } catch (error) { toast.error("Failed to load transactions"); }
    };

    const fetchRestockHistory = async (itemId: string, page: number) => {
        try {
            const { data } = await api.get(`/inventory/items/${itemId}/restock-history?page=${page}&limit=${PAGE_SIZE}`);
            setRestockHistory(data.data);
            setRestockTotalPages(data.pagination.pages);
        } catch (error) { toast.error("Failed to load restock history"); }
    };

    // Pagination Handlers - Sheet
    const handleTxPageChange = (newPage: number) => {
        if (!selectedItemHistory) return;
        setTxPage(newPage);
        fetchHistoryTransactions(selectedItemHistory._id, newPage);
    };

    const handleRestockPageChange = (newPage: number) => {
        if (!selectedItemHistory) return;
        setRestockPage(newPage);
        fetchRestockHistory(selectedItemHistory._id, newPage);
    };


    // Actions
    const onAddItem = async (v: any) => {
        setIsSubmittingAddItem(true);
        try { await api.post('/inventory/items', v); toast.success("Added"); setIsAddItemOpen(false); addItemForm.reset(); fetchItems(); }
        catch (e) { toast.error("Failed"); }
        finally { setIsSubmittingAddItem(false); }
    };

    const onEditItem = async (v: z.infer<typeof editItemSchema>) => {
        setIsSubmittingEditItem(true);
        try {
            await api.put(`/inventory/items/${selectedItem?._id}`, v);
            toast.success("Updated");
            setIsEditItemOpen(false);
            fetchItems();
        } catch (e) { toast.error("Failed to update item"); }
        finally { setIsSubmittingEditItem(false); }
    };

    const onRestock = async (v: any) => {
        setIsSubmittingRestock(true);
        try { await api.put(`/inventory/items/${selectedItem?._id}/restock`, v); toast.success("Restocked"); setIsRestockOpen(false); fetchItems(); }
        catch (e) { toast.error("Failed"); }
        finally { setIsSubmittingRestock(false); }
    };

    const onRent = async (v: any) => {
        setIsSubmittingRent(true);
        try {
            await api.post('/inventory/transactions', v);
            toast.success("Issued"); setIsRentOpen(false); fetchItems();
        } catch (e: any) { toast.error(e.response?.data?.message || "Failed to create transaction"); }
        finally { setIsSubmittingRent(false); }
    };

    const onDamage = async (v: z.infer<typeof damageSchema>) => {
        setIsSubmittingDamage(true);
        try {
            if (v.quantity > (selectedItem?.availableQuantity || 0)) return toast.error("Not enough stock to write off");
            await api.put(`/inventory/items/${selectedItem?._id}/damage`, v);
            toast.success("Damage reported"); setIsDamageOpen(false); fetchItems();
        } catch (e) { toast.error("Failed to report damage"); }
        finally { setIsSubmittingDamage(false); }
    };

    const handleReturnClick = async (tx: Transaction, isHistory = false) => {
        setIsSubmittingReturn(true);
        try {
            await api.put(`/inventory/transactions/${tx._id}/return`);
            toast.success("Returned");
            fetchItems();
            if (activeTab === 'rentals') fetchActiveTransactions();
            if (activeTab === 'history') fetchAllRentals();
            if (isHistory && selectedItemHistory) {
                fetchHistoryTransactions(selectedItemHistory._id, txPage);
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to return");
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const handleLedgerClick = async (tx: Transaction) => {
        setSelectedReturnTx(tx);
        const pendingAmount = tx.totalRentAmount - (tx.paidAmount || 0);
        returnForm.reset({ amountPaid: pendingAmount > 0 ? pendingAmount : 0, accountId: '' });
        setIsLedgerOpen(true);
        fetchLedgerReceipts(tx._id);
    };

    const fetchLedgerReceipts = async (txId: string) => {
        try {
            const { data } = await api.get(`/inventory/transactions/${txId}/receipts`);
            setLedgerData(data.data || { payments: [], receipt: null });
        } catch (e) { toast.error("Failed to load ledger"); }
    };

    const onPayRent = async (v: z.infer<typeof returnSchema>) => {
        if (!selectedReturnTx) return;
        setIsSubmittingPayment(true);
        try {
            await api.post(`/inventory/transactions/${selectedReturnTx._id}/pay`, {
                accountId: v.accountId,
                amountPaid: v.amountPaid
            });
            toast.success("Payment recorded");

            // Refresh Data
            fetchLedgerReceipts(selectedReturnTx._id);
            fetchItems();
            if (activeTab === 'rentals') fetchActiveTransactions();
            if (activeTab === 'history') fetchAllRentals();
            if (selectedItemHistory) {
                fetchHistoryTransactions(selectedItemHistory._id, txPage);
            }

            // Update local state so modal updates balance immediately
            setSelectedReturnTx({
                ...selectedReturnTx,
                paidAmount: (selectedReturnTx.paidAmount || 0) + Number(v.amountPaid)
            });
            returnForm.reset({ amountPaid: 0, accountId: '' });
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Payment Failed");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleDownloadPdf = async (receiptId: string) => {
        try {
            const res = await api.get(`/inventory/receipts/${receiptId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Inventory-Receipt-${receiptId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download PDF");
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground text-sm">Manage assets and rentals.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => {
                        rentForm.reset({
                            items: [{ itemId: '', quantity: 1, rentPerUnit: 0 }],
                            typ: 'RENT_OUT',
                            customerName: '',
                            customerPhone: '',
                            notes: ''
                        });
                        setIsRentOpen(true);
                    }} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> New Rental Order
                    </Button>
                    <Button onClick={() => setIsAddItemOpen(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> New Item
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="items">All Items</TabsTrigger>
                    <TabsTrigger value="rentals">Active Rentals</TabsTrigger>
                    <TabsTrigger value="history">Rental History</TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base font-semibold">Inventory Items</CardTitle>
                                    <CardDescription className="text-xs">
                                        Showing {items.length} of {itemsTotal} items
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search items..."
                                        className="pl-8 h-9 text-sm"
                                        value={itemsSearch}
                                        onChange={(e) => { setItemsSearch(e.target.value); setItemsPage(1); }}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-9 text-xs font-semibold">Item Name</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Stock</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Avail</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Avg. Cost</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Rent Rate</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {itemsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                                No items found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => (
                                            <TableRow key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                <TableCell className="py-2 text-sm font-medium">{item.name}</TableCell>
                                                <TableCell className="py-2 text-sm text-right font-mono">{item.totalQuantity}</TableCell>
                                                <TableCell className="py-2 text-sm text-right font-mono font-bold text-green-600">{item.availableQuantity}</TableCell>
                                                <TableCell className="py-2 text-sm text-right text-muted-foreground font-mono">₹{item.averageValue.toFixed(0)}</TableCell>
                                                <TableCell className="py-2 text-sm text-right font-mono">₹{item.rentalRate.toFixed(0)}</TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-6 w-6 p-0"><MoreHorizontal className="h-3 w-3" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-xs" onClick={() => {
                                                                setSelectedItem(item);
                                                                editItemForm.reset({
                                                                    name: item.name,
                                                                    averageValue: item.averageValue,
                                                                    rentalRate: item.rentalRate
                                                                });
                                                                setIsEditItemOpen(true);
                                                            }}>
                                                                <Filter className="mr-2 h-3 w-3" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-xs" onClick={() => { setSelectedItem(item); setIsRestockOpen(true); }}>
                                                                <Plus className="mr-2 h-3 w-3" /> Restock
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-xs" onClick={() => {
                                                                setSelectedItem(item);
                                                                rentForm.reset({
                                                                    items: [{ itemId: item._id, quantity: 1, rentPerUnit: item.rentalRate }],
                                                                    typ: 'RENT_OUT',
                                                                    customerName: '',
                                                                    customerPhone: '',
                                                                    notes: ''
                                                                });
                                                                setIsRentOpen(true);
                                                            }}>
                                                                <ArrowRightLeft className="mr-2 h-3 w-3" /> Issue / Rent
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-xs text-red-600 focus:text-red-600" onClick={() => {
                                                                setSelectedItem(item);
                                                                damageForm.reset({ quantity: 1, notes: '' });
                                                                setIsDamageOpen(true);
                                                            }}>
                                                                <AlertTriangle className="mr-2 h-3 w-3" /> Report Damage
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-xs" onClick={() => openItemHistory(item)}>
                                                                <History className="mr-2 h-3 w-3" /> View History
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {/* Pagination Footer */}
                            {itemsTotalPages > 1 && (
                                <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                                    <span className="text-xs text-muted-foreground mr-2">Page {itemsPage} of {itemsTotalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setItemsPage(p => Math.max(1, p - 1))}
                                        disabled={itemsPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setItemsPage(p => Math.min(itemsTotalPages, p + 1))}
                                        disabled={itemsPage >= itemsTotalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rentals" className="space-y-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base font-semibold">Active Rentals</CardTitle>
                                    <CardDescription className="text-xs">
                                        Items currently rented out or in active transaction
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-9 text-xs font-semibold">Date</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold">Item</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold">Customer</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Qty</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Rent</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-center">Status</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                                No active rentals found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                <TableCell className="py-2 text-xs text-muted-foreground">{new Date(tx.issuedDate).toLocaleDateString()}</TableCell>
                                                <TableCell className="py-2 text-sm font-medium">{tx.items?.map(i => i.itemId?.name).join(', ')}</TableCell>
                                                <TableCell className="py-2 text-sm">
                                                    <div>{tx.customerName}</div>
                                                    <div className="text-[10px] text-muted-foreground">{tx.customerPhone}</div>
                                                </TableCell>
                                                <TableCell className="py-2 text-sm text-right font-mono">{tx.items?.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                                                <TableCell className="py-2 text-right">
                                                    <div className="text-sm font-mono text-muted-foreground">₹{tx.totalRentAmount}</div>
                                                    {(tx.paidAmount || 0) > 0 && <div className="text-[10px] text-green-600 font-mono">Pd: ₹{tx.paidAmount}</div>}
                                                    {(tx.totalRentAmount - (tx.paidAmount || 0)) > 0 && <div className="text-[10px] text-red-600 font-mono">Due: ₹{tx.totalRentAmount - (tx.paidAmount || 0)}</div>}
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Badge variant={tx.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] h-5 px-2 font-medium">{tx.status}</Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => handleLedgerClick(tx)}>
                                                            Ledger
                                                        </Button>
                                                        {tx.status === 'ACTIVE' && (
                                                            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs hover:bg-primary/10 hover:text-primary" onClick={() => handleReturnClick(tx)} disabled={isSubmittingReturn}>
                                                                {isSubmittingReturn ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Return'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {/* Pagination Footer - Transactions */}
                            {txMainTotalPages > 1 && (
                                <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                                    <span className="text-xs text-muted-foreground mr-2">Page {txMainPage} of {txMainTotalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTxMainPage(p => Math.max(1, p - 1))}
                                        disabled={txMainPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTxMainPage(p => Math.min(txMainTotalPages, p + 1))}
                                        disabled={txMainPage >= txMainTotalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base font-semibold">Rental History</CardTitle>
                                    <CardDescription className="text-xs">
                                        All past and active rental transactions
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-9 text-xs font-semibold">Date</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold">Item</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold">Customer</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Qty</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Rent</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-center">Status</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allRentalsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : allRentals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                                No rental history found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        allRentals.map((tx) => (
                                            <TableRow key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                <TableCell className="py-2 text-xs text-muted-foreground">
                                                    <div>{new Date(tx.issuedDate).toLocaleDateString()}</div>
                                                    {tx.returnedDate && <div className="text-[10px] text-green-600">Ret: {new Date(tx.returnedDate).toLocaleDateString()}</div>}
                                                </TableCell>
                                                <TableCell className="py-2 text-sm font-medium">{tx.items?.map(i => i.itemId?.name).join(', ')}</TableCell>
                                                <TableCell className="py-2 text-sm">
                                                    <div>{tx.customerName}</div>
                                                    <div className="text-[10px] text-muted-foreground">{tx.customerPhone}</div>
                                                </TableCell>
                                                <TableCell className="py-2 text-sm text-right font-mono">{tx.items?.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                                                <TableCell className="py-2 text-right">
                                                    <div className="text-sm font-mono text-muted-foreground">₹{tx.totalRentAmount}</div>
                                                    {(tx.paidAmount || 0) > 0 && <div className="text-[10px] text-green-600 font-mono">Pd: ₹{tx.paidAmount}</div>}
                                                    {(tx.totalRentAmount - (tx.paidAmount || 0)) > 0 && <div className="text-[10px] text-red-600 font-mono">Due: ₹{tx.totalRentAmount - (tx.paidAmount || 0)}</div>}
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    <Badge variant={tx.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] h-5 px-2 font-medium">{tx.status}</Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => handleLedgerClick(tx)}>
                                                            Ledger
                                                        </Button>
                                                        {tx.status === 'ACTIVE' && (
                                                            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs hover:bg-primary/10 hover:text-primary" onClick={() => handleReturnClick(tx)} disabled={isSubmittingReturn}>
                                                                {isSubmittingReturn ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Return'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {allRentalsTotalPages > 1 && (
                                <div className="p-4 border-t flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                                    <span className="text-xs text-muted-foreground mr-2">Page {allRentalsPage} of {allRentalsTotalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAllRentalsPage(p => Math.max(1, p - 1))}
                                        disabled={allRentalsPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAllRentalsPage(p => Math.min(allRentalsTotalPages, p + 1))}
                                        disabled={allRentalsPage >= allRentalsTotalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Sheet: Item History */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[600px] p-0 flex flex-col gap-0">
                    <div className="p-4 border-b bg-muted/40">
                        <SheetHeader>
                            <SheetTitle className="text-base">{selectedItemHistory?.name}</SheetTitle>
                            <SheetDescription className="text-xs">History and Transactions</SheetDescription>
                        </SheetHeader>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="rounded border bg-background p-2 text-center">
                                <div className="text-xs text-muted-foreground">Total Stock</div>
                                <div className="text-sm font-bold font-mono">{selectedItemHistory?.totalQuantity}</div>
                            </div>
                            <div className="rounded border bg-background p-2 text-center">
                                <div className="text-xs text-muted-foreground">Available</div>
                                <div className="text-sm font-bold text-green-600 font-mono">{selectedItemHistory?.availableQuantity}</div>
                            </div>
                            <div className="rounded border bg-background p-2 text-center">
                                <div className="text-xs text-muted-foreground">Rental Rate</div>
                                <div className="text-sm font-bold font-mono">₹{selectedItemHistory?.rentalRate}</div>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Transactions Section */}
                            <div>
                                <h3 className="text-xs font-semibold mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><ArrowRightLeft className="h-3 w-3" /> Recent Transactions</span>
                                    {txTotalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleTxPageChange(Math.max(1, txPage - 1))} disabled={txPage === 1}><ChevronLeft className="h-3 w-3" /></Button>
                                            <span className="text-[10px] text-muted-foreground w-12 text-center">{txPage} of {txTotalPages}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleTxPageChange(Math.min(txTotalPages, txPage + 1))} disabled={txPage >= txTotalPages}><ChevronRight className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                </h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="h-8 bg-muted/20">
                                                <TableHead className="h-8 text-xs">Date</TableHead>
                                                <TableHead className="h-8 text-xs">Customer</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Rent</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Qty</TableHead>
                                                <TableHead className="h-8 text-xs text-right w-[60px]">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {itemTransactions.map(tx => (
                                                <TableRow key={tx._id} className="h-10">
                                                    <TableCell className="text-xs">
                                                        <div>{new Date(tx.issuedDate).toLocaleDateString()}</div>
                                                        {tx.returnedDate && <div className="text-[10px] text-green-600">Ret: {new Date(tx.returnedDate).toLocaleDateString()}</div>}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="font-medium truncate max-w-[80px] sm:max-w-[100px]">{tx.customerName}</div>
                                                        <Badge variant={tx.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[8px] h-3 px-1">{tx.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right">
                                                        <div className="font-mono text-muted-foreground">₹{tx.totalRentAmount}</div>
                                                        {(tx.paidAmount || 0) > 0 && <div className="text-[9px] text-green-600 font-mono">Pd: ₹{tx.paidAmount}</div>}
                                                        {(tx.totalRentAmount - (tx.paidAmount || 0)) > 0 && <div className="text-[9px] text-red-600 font-mono">Due: ₹{tx.totalRentAmount - (tx.paidAmount || 0)}</div>}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right font-medium font-mono">{tx.items?.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                                                    <TableCell className="text-xs text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleLedgerClick(tx)}><History className="h-3 w-3" /></Button>
                                                            {tx.status === 'ACTIVE' && <Button size="icon" variant="ghost" className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleReturnClick(tx, true)} disabled={isSubmittingReturn}><ArrowLeft className="h-3 w-3" /></Button>}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {itemTransactions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">No transactions found.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <Separator />

                            {/* Restock History Section */}
                            <div>
                                <h3 className="text-xs font-semibold mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-muted-foreground"><History className="h-3 w-3" /> History Logs (Restock/Damage)</span>
                                    {restockTotalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleRestockPageChange(Math.max(1, restockPage - 1))} disabled={restockPage === 1}><ChevronLeft className="h-3 w-3" /></Button>
                                            <span className="text-[10px] text-muted-foreground w-12 text-center">{restockPage} of {restockTotalPages}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleRestockPageChange(Math.min(restockTotalPages, restockPage + 1))} disabled={restockPage >= restockTotalPages}><ChevronRight className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                </h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="h-8 bg-muted/20">
                                                <TableHead className="h-8 text-xs">Date</TableHead>
                                                <TableHead className="h-8 text-xs">Type</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Qty</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Cost/Val</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {restockHistory.map((h: any, i: number) => (
                                                <TableRow key={i} className="h-8">
                                                    <TableCell className="text-xs">{new Date(h.date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <Badge variant={h.typ === 'DAMAGE' ? "destructive" : "outline"} className="text-[10px] h-4 px-1">
                                                            {h.typ.toLowerCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right font-mono">{h.quantity}</TableCell>
                                                    <TableCell className="text-xs text-right font-mono">₹{h.cost.toFixed(0)}</TableCell>
                                                </TableRow>
                                            ))}
                                            {restockHistory.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">No history.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Modals */}
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Item</DialogTitle></DialogHeader>
                    {/* Add Item Form */}
                    <Form {...addItemForm}>
                        <form onSubmit={addItemForm.handleSubmit(onAddItem)} className="space-y-3">
                            <FormField control={addItemForm.control} name="name" render={({ field }) => (<FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-3 gap-2">
                                <FormField control={addItemForm.control} name="totalQuantity" render={({ field }) => (<FormItem><FormLabel className="text-xs">Qty</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={addItemForm.control} name="averageValue" render={({ field }) => (<FormItem><FormLabel className="text-xs">Cost/Unit</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={addItemForm.control} name="rentalRate" render={({ field }) => (<FormItem><FormLabel className="text-xs">Rent/Unit</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <DialogFooter><Button type="submit" size="sm" disabled={isSubmittingAddItem}>{isSubmittingAddItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
                    <Form {...editItemForm}>
                        <form onSubmit={editItemForm.handleSubmit(onEditItem)} className="space-y-3">
                            <FormField control={editItemForm.control} name="name" render={({ field }) => (<FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField control={editItemForm.control} name="averageValue" render={({ field }) => (<FormItem><FormLabel className="text-xs">Cost/Unit</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={editItemForm.control} name="rentalRate" render={({ field }) => (<FormItem><FormLabel className="text-xs">Rent/Unit</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <DialogFooter><Button type="submit" size="sm" disabled={isSubmittingEditItem}>{isSubmittingEditItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update'}</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Restock</DialogTitle></DialogHeader>
                    <Form {...restockForm}>
                        <form onSubmit={restockForm.handleSubmit(onRestock)} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <FormField control={restockForm.control} name="quantity" render={({ field }) => (<FormItem><FormLabel className="text-xs">Qty</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={restockForm.control} name="unitCost" render={({ field }) => (<FormItem><FormLabel className="text-xs">New Cost</FormLabel><FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <DialogFooter><Button type="submit" size="sm">Restock</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Report Damage Dialog */}
            <Dialog open={isDamageOpen} onOpenChange={setIsDamageOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Report Damage
                        </DialogTitle>
                        <DialogDescription>
                            This will reduce the stock quantity permanently (Write-off).
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...damageForm}>
                        <form onSubmit={damageForm.handleSubmit(onDamage)} className="space-y-4">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                                <div className="text-xs text-red-800 font-medium">Item: {selectedItem?.name}</div>
                                <div className="text-xs text-red-600">Available Stock: {selectedItem?.availableQuantity}</div>
                            </div>

                            <FormField control={damageForm.control} name="quantity" render={({ field }) => (<FormItem><FormLabel className="text-xs">Quantity Damaged</FormLabel><FormControl><Input type="number" {...field} max={selectedItem?.availableQuantity} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={damageForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel className="text-xs">Notes (Optional)</FormLabel><FormControl><Input {...field} placeholder="Reason for damage..." className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsDamageOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="destructive" size="sm">Confirm Write-off</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Rent/Issue Dialog */}
            <Dialog open={isRentOpen} onOpenChange={setIsRentOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>New Rental Order</DialogTitle>
                        <DialogDescription>Add multiple items to issue to a customer or for internal use.</DialogDescription>
                    </DialogHeader>

                    <Form {...rentForm}>
                        <form onSubmit={rentForm.handleSubmit(onRent)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={rentForm.control} name="typ" render={({ field }) => (<FormItem><FormLabel className="text-xs">Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="RENT_OUT">Rent Out</SelectItem><SelectItem value="USE_INTERNAL">Internal Use</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={rentForm.control} name="customerName" render={({ field }) => (<FormItem><FormLabel className="text-xs">Customer Name</FormLabel><FormControl><Input {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                            <FormField control={rentForm.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel className="text-xs">Phone (Optional)</FormLabel><FormControl><Input {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold">Items Cart</h4>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendRentItem({ itemId: '', quantity: 1, rentPerUnit: 0 })} className="h-7 text-xs">
                                        <Plus className="h-3 w-3 mr-1" /> Add Item
                                    </Button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                    {rentItems.map((field, index) => {
                                        const selectedItemObj = allItems.find(i => i._id === rentFormItems?.[index]?.itemId);
                                        return (
                                            <div key={field.id} className="p-3 bg-muted/30 border rounded-md relative flex flex-col gap-2">
                                                {rentItems.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-red-500 hover:text-red-700" onClick={() => removeRentItem(index)}>
                                                        <AlertTriangle className="h-4 w-4" /> {/* Close/Remove Icon Placeholder */}
                                                        <span className="sr-only">Remove</span>
                                                    </Button>
                                                )}

                                                <FormField control={rentForm.control} name={`items.${index}.itemId`} render={({ field: selectField }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Select Item</FormLabel>
                                                        <Select onValueChange={(val) => {
                                                            selectField.onChange(val);
                                                            const it = allItems.find(i => i._id === val);
                                                            if (it && rentFormType === 'RENT_OUT') {
                                                                rentForm.setValue(`items.${index}.rentPerUnit`, it.rentalRate);
                                                            }
                                                        }} defaultValue={selectField.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Select an item" /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {allItems.map(it => (
                                                                    <SelectItem key={it._id} value={it._id} disabled={it.availableQuantity <= 0}>
                                                                        {it.name} (Stock: {it.availableQuantity})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />

                                                <div className="grid grid-cols-2 gap-2">
                                                    <FormField control={rentForm.control} name={`items.${index}.quantity`} render={({ field: qtyField }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Qty {selectedItemObj ? `(Max: ${selectedItemObj.availableQuantity})` : ''}</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" {...qtyField} max={selectedItemObj?.availableQuantity} className="h-8 text-xs" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    {rentFormType === 'RENT_OUT' && (
                                                        <FormField control={rentForm.control} name={`items.${index}.rentPerUnit`} render={({ field: rentField }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Rent Price (Per Unit)</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...rentField} className="h-8 text-xs bg-background" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {rentFormType === 'RENT_OUT' && (
                                <div className="p-3 bg-muted/40 rounded-md border flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Rent Amount</span>
                                    <span className="text-lg font-mono font-bold text-primary">
                                        ₹{rentFormItems?.reduce((total, item) => total + ((item.quantity || 0) * (item.rentPerUnit || 0)), 0) || 0}
                                    </span>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" size="sm" disabled={isSubmittingRent}>
                                    {isSubmittingRent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Confirm Order
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Ledger and Payment Dialog */}
            <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Rent Ledger & Payments</DialogTitle>
                        <DialogDescription>
                            View payment history and record new payments for this rental.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/40 rounded-md border space-y-2">
                                <div className="text-xs font-medium">Rent Details</div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Total Rent:</span>
                                    <span>₹{selectedReturnTx?.totalRentAmount}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Paid Amount:</span>
                                    <span>₹{selectedReturnTx?.paidAmount || 0}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-xs font-bold">
                                    <span>Balance Due:</span>
                                    <span className={((selectedReturnTx?.totalRentAmount || 0) - (selectedReturnTx?.paidAmount || 0)) > 0 ? "text-red-600" : "text-green-600"}>
                                        ₹{Math.max(0, (selectedReturnTx?.totalRentAmount || 0) - (selectedReturnTx?.paidAmount || 0))}
                                    </span>
                                </div>
                            </div>

                            {((selectedReturnTx?.totalRentAmount || 0) - (selectedReturnTx?.paidAmount || 0)) > 0 && (
                                <Form {...returnForm}>
                                    <form onSubmit={returnForm.handleSubmit(onPayRent)} className="space-y-3">
                                        <div className="text-xs font-semibold">Make Payment</div>
                                        <FormField control={returnForm.control} name="amountPaid" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Amount</FormLabel>
                                                <FormControl><Input type="number" {...field} className="h-8 text-xs" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={returnForm.control} name="accountId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Deposit Account</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Account" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit" size="sm" className="w-full" disabled={isSubmittingPayment}>
                                            {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Record Payment
                                        </Button>
                                    </form>
                                </Form>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold">Payment History</div>
                            <ScrollArea className="h-[200px] border rounded-md p-2 mb-2">
                                {ledgerData.payments.length === 0 ? (
                                    <div className="text-xs text-muted-foreground text-center py-4">No payments recorded yet.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {ledgerData.payments.map((payment: any, index: number) => (
                                            <div key={index} className="flex flex-col gap-1 p-2 border rounded-md text-xs bg-slate-50 dark:bg-slate-900">
                                                <div className="flex justify-between font-medium">
                                                    <span>Payment {ledgerData.payments.length - index}</span>
                                                    <span>₹{payment.amount}</span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground text-[10px]">
                                                    <span>{new Date(payment.date).toLocaleDateString()}</span>
                                                    <span>{payment.accountId?.name || 'Account'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            {ledgerData.receipt && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md flex items-center justify-between">
                                    <div className="text-xs">
                                        <span className="font-semibold text-green-700 dark:text-green-400">Fully Paid</span>
                                        <div className="text-[10px] text-green-600 dark:text-green-500">Official Receipt Generated</div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-slate-950" onClick={() => handleDownloadPdf(ledgerData.receipt._id)}>
                                        <Download className="mr-1 h-3 w-3" /> Download PDF
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
