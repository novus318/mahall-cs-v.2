'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, Printer, Pencil, Tag } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PaymentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<any[]>([]);
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
        fetchPayments();
        fetchCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, page]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Filter out DELETED payments by default
            const { data } = await api.get(`/payments?page=${page}&limit=20&search=${search}&status=PENDING&status=COMPLETED`);
            setPayments(data.data);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/payments/categories');
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
                const { data } = await api.put(`/payments/categories/${editingCategory._id}`, {
                    name: newCatName,
                    description: newCatDesc
                });
                toast.success("Category updated");
                setCategories(categories.map(cat => cat._id === editingCategory._id ? data.data : cat));
            } else {
                // Create
                const { data } = await api.post('/payments/categories', { name: newCatName, description: newCatDesc });
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

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This will remove the category from future selection.")) return;
        try {
            await api.delete(`/payments/categories/${id}`);
            toast.success("Category removed");
            setCategories(categories.filter(c => c._id !== id));
        } catch (error) {
            toast.error("Failed to delete category");
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Finances · Payments
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Payments</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Manage expenses and payment receipts.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/payments/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Create Payment
                </Button>
            </div>

            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">Payment History</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search receipt or payee..." className="h-9 bg-background pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    <Card className="bg-card shadow-sm">
                        <CardHeader className="border-b bg-muted/40 !pb-1 p-3">
                            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
                        </CardHeader>
                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-12.5 font-semibold text-xs uppercase tracking-wider">#</TableHead>
                                        <TableHead className="w-27.5 font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Payee</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Account</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                                        <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
                                    ) : payments.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No payments found.</TableCell></TableRow>
                                    ) : (
                                        payments.map((payment) => (
                                            <TableRow key={payment._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/payments/${payment._id}`)}>
                                                <TableCell className="font-medium text-xs text-muted-foreground">{payment.receiptNo}</TableCell>
                                                <TableCell className="text-xs">{format(new Date(payment.date), 'MMM d, yyyy')}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{payment.payee?.name || '-'}</span>
                                                        {payment.payee?.type && <span className="text-[10px] text-muted-foreground uppercase">{payment.payee.type}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal text-xs">{payment.category?.name || '-'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{payment.account?.name || '-'}</TableCell>
                                                <TableCell className="text-right font-semibold tabular-nums">₹{payment.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={cn(
                                                            "font-normal text-xs border-0",
                                                            payment.status === 'COMPLETED' && "bg-chart-1/10 text-chart-1",
                                                            payment.status === 'PENDING' && "bg-chart-2/10 text-chart-2",
                                                            payment.status !== 'COMPLETED' && payment.status !== 'PENDING' && "bg-destructive/10 text-destructive"
                                                        )}
                                                    >
                                                        {payment.status === 'COMPLETED' ? 'Completed' : payment.status === 'PENDING' ? 'Pending' : 'Deleted'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-chart-3/10 hover:text-chart-3" onClick={(e) => { e.stopPropagation(); window.open(`https://api.tmj.org.in/api/payments/${payment._id}/pdf`, '_blank'); }}>
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-chart-2/10 hover:text-chart-2" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/payments/edit/${payment._id}`); }}>
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
                                    {categories.length > 0 ? `${categories.length} payment categories` : "Manage payment classification types."}
                                </p>
                            </div>
                            <Button size="sm" onClick={() => setIsCatDialogOpen(true)}>
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
                            <Input placeholder="e.g. Maintenance" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
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
