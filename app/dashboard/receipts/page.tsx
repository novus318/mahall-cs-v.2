'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, Pencil, Printer, ExternalLink, Tag, FileSpreadsheet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ReceiptsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Category Management State
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null); // New State
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');

    useEffect(() => {
        fetchReceipts();
        fetchCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReceipts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, page, categoryFilter, fromDate, toDate]);

    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const categoryParam = categoryFilter !== 'ALL' ? `&category=${categoryFilter}` : '';
            const dateParam = (fromDate ? `&from=${fromDate}` : '') + (toDate ? `&to=${toDate}` : '');
            const { data } = await api.get(`/receipts?page=${page}&limit=20&search=${search}${categoryParam}${dateParam}`);
            setReceipts(data.data);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error("Failed to load receipts");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const { data } = await api.post('/receipts/export', {
                search,
                category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
            }, { responseType: 'blob' });
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipts-${fromDate || 'all'}-${toDate || 'all'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success('Receipts exported');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Export failed');
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/receipts/categories');
            setCategories(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenCatDialog = (category: any = null) => {
        if (category) {
            setEditingCategory(category);
            setNewCatName(category.name);
            setNewCatDesc(category.description || '');
        } else {
            setEditingCategory(null);
            setNewCatName('');
            setNewCatDesc('');
        }
        setIsCatDialogOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!newCatName.trim()) {
            toast.error("Category name is required");
            return;
        }

        try {
            if (editingCategory) {
                // Update
                const { data } = await api.put(`/receipts/categories/${editingCategory._id}`, {
                    name: newCatName,
                    description: newCatDesc
                });
                toast.success("Category updated");
                setCategories(categories.map(cat => cat._id === editingCategory._id ? data.data : cat));
            } else {
                // Create
                const { data } = await api.post('/receipts/categories', { name: newCatName, description: newCatDesc });
                toast.success("Category created");
                setCategories([...categories, data.data]);
            }
            setIsCatDialogOpen(false);
            setNewCatName('');
            setNewCatDesc('');
            setEditingCategory(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save category");
        }
    };

    const handleThermalPrint = (receipt: any) => {
        window.location.href = `my.bluetoothprint.scheme://print/inc/${receipt._id}`;
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This will remove the category from future selection.")) return;
        try {
            await api.delete(`/receipts/categories/${id}`);
            toast.success("Category removed");
            fetchCategories();
        } catch (error) {
            toast.error("Failed to delete category");
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Finances · Receipts
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Receipts (Income)</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Manage income, donations, and fees.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/receipts/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Create Receipt
                </Button>
            </div>

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">Receipt History</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Search receipt or payer..." className="h-9 bg-background pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                                <SelectTrigger className="h-9 w-full sm:w-[180px] bg-background">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Categories</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Input type="date" className="h-9 w-[150px] bg-background" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
                                <span className="text-xs text-muted-foreground">to</span>
                                <Input type="date" className="h-9 w-[150px] bg-background" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                            <FileSpreadsheet className="h-4 w-4" /> Export Excel
                        </Button>
                    </div>

                    <Card className="bg-card shadow-sm">
                        <CardHeader className="border-b bg-muted/40 !pb-1 p-4">
                            <CardTitle className="text-base font-semibold">Recent Receipts</CardTitle>
                        </CardHeader>
                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Receipt No</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Received From</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Deposit Account</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                                        <TableHead className="w-[100px] text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
                                    ) : receipts.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No receipts found.</TableCell></TableRow>
                                    ) : (
                                        receipts.map((receipt) => (
                                            <TableRow
                                                key={receipt._id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/dashboard/receipts/${receipt._id}`)}
                                            >
                                                <TableCell className="font-mono font-medium">{receipt.receiptNo}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{format(new Date(receipt.date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell className="font-medium">{receipt.payer}</TableCell>
                                                <TableCell><Badge variant="secondary" className="font-normal border-transparent bg-chart-1/10 text-chart-1">{receipt.category?.name}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{receipt.account?.name}</TableCell>
                                                <TableCell className="text-right font-bold tabular-nums text-chart-1">+₹{receipt.amount?.toLocaleString()}</TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-chart-3/10 hover:text-chart-3" onClick={() => window.open(`https://api.tmj.org.in/api/receipts/${receipt._id}/pdf`, '_blank')} title="View PDF">
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-chart-4/10 hover:text-chart-4" onClick={() => handleThermalPrint(receipt)} title="Print via Bluetooth">
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-chart-2/10 hover:text-chart-2" onClick={() => router.push(`/dashboard/receipts/edit/${receipt._id}`)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <Card className="bg-card shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/40 p-4">
                            <div>
                                <CardTitle className="text-base font-semibold">Categories</CardTitle>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {categories.length > 0 ? `${categories.length} income categories` : "Manage income classification types."}
                                </p>
                            </div>
                            <Button size="sm" onClick={() => handleOpenCatDialog()}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Add Category
                            </Button>
                        </CardHeader>
                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-50 font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Description</TableHead>
                                        <TableHead className="w-37.5 text-right font-semibold text-xs uppercase tracking-wider">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Tag className="h-8 w-8 text-muted-foreground/40" />
                                                    <p className="text-sm">No categories yet. Add your first one.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((cat) => (
                                            <TableRow key={cat._id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                                                            <Tag className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="font-medium">{cat.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-md truncate text-muted-foreground">{cat.description || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 hover:text-chart-2" onClick={() => handleOpenCatDialog(cat)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 bg-destructive/10 px-2 text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDeleteCategory(cat._id)}>
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Payment Category" : "Add Payment Category"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input placeholder="e.g. Donation, Maintenance Fee" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea placeholder="Optional description" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveCategory}>{editingCategory ? "Update Category" : "Create Category"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
