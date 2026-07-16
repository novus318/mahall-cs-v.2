'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, Pencil, Printer, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ReceiptsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [search, setSearch] = useState('');
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
    }, [search, page]);

    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/receipts?page=${page}&limit=20&search=${search}`);
            setReceipts(data.data);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error("Failed to load receipts");
        } finally {
            setLoading(false);
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
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Receipts (Income)</h2>
                    <p className="text-muted-foreground text-sm">Manage income, donations, and fees.</p>
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
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search receipt or payer..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="p-4 border-b bg-slate-50/50">
                            <CardTitle className="text-base font-semibold">Recent Receipts</CardTitle>
                        </CardHeader>
                        <div className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Receipt No</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Received From</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Deposit Account</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                                                className="cursor-pointer hover:bg-slate-50"
                                                onClick={() => router.push(`/dashboard/receipts/${receipt._id}`)}
                                            >
                                                <TableCell className="font-mono font-medium">{receipt.receiptNo}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{format(new Date(receipt.date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell className="font-medium">{receipt.payer}</TableCell>
                                                <TableCell><Badge variant="secondary" className="font-normal border-transparent bg-green-50 text-green-700 hover:bg-green-100">{receipt.category?.name}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{receipt.account?.name}</TableCell>
                                                <TableCell className="text-right font-bold text-green-700">+₹{receipt.amount?.toLocaleString()}</TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`https://api.tmj.org.in/api/receipts/${receipt._id}/pdf`, '_blank')} title="View PDF">
                                                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleThermalPrint(receipt)} title="Print via Bluetooth">
                                                            <Printer className="h-3.5 w-3.5 text-primary" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/dashboard/receipts/edit/${receipt._id}`)}>
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

                <TabsContent value="categories" className="animate-in fade-in-50">
                    <Card className="border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border bg-muted/20">
                            <div>
                                <CardTitle className="text-base font-semibold">Categories</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">Manage income classification types.</p>
                            </div>
                            <Button size="sm" onClick={() => handleOpenCatDialog()}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Add Category
                            </Button>
                        </CardHeader>
                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-12.5 font-semibold text-xs uppercase tracking-wider">#</TableHead>
                                        <TableHead className="w-25 font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Payer</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((cat) => (
                                        <TableRow key={cat._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{cat.description || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenCatDialog(cat)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCategory(cat._id)}>
                                                        Remove
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
