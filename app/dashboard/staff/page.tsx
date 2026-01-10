'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Plus, Search, Loader2, ArrowRight, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/axios';

const staffSchema = z.object({
    name: z.string().min(2, "Name required"),
    dob: z.string().min(1, "Date of Birth required"),
    employeeId: z.string().min(1, "ID required"),
    department: z.string().min(1, "Department required"),
    position: z.string().min(1, "Position required"),
    baseSalary: z.coerce.number().min(0, "Salary required"),
    phone: z.string().min(10, "Valid phone required"),
    email: z.string().email().optional().or(z.literal('')),
    joinDate: z.string().min(1, "Join Date required")
});

export default function StaffPage() {
    // Data State
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [isAddOpen, setIsAddOpen] = useState(false);

    const form = useForm({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            name: '',
            dob: '',
            employeeId: '',
            department: '',
            position: '',
            baseSalary: 0,
            phone: '',
            email: '',
            joinDate: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchStaff();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [page, search, limit]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/staff', {
                params: { page, limit, search }
            });
            // Handle both old (flat array) and new (paginated object) backend responses gracefully during transition
            if (Array.isArray(data.data)) { // Old backend fallback or if backend sends array directly
                setStaffList(data.data);
                // Assume client-side filtering if backend isn't paginating yet (though we just updated it)
                // But since we updated backend, we expect data.data to be array, and data.page/pages/total to exist
                setPage(data.page || 1);
                setTotalPages(data.pages || 1);
                setTotal(data.total || data.data.length);
            } else {
                setStaffList([]);
            }
        } catch (error) {
            toast.error("Failed to load staff");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (values: z.infer<typeof staffSchema>) => {
        try {
            await api.post('/staff', values);
            toast.success("Staff member added");
            setIsAddOpen(false);
            form.reset();
            fetchStaff();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add staff");
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
                    <p className="text-muted-foreground text-sm">Manage employees and payroll.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Staff
                </Button>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-semibold">All Staff</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {staffList.length} of {total} records
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search staff..."
                                className="pl-8 h-9 text-sm"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[100px] h-9 text-xs font-semibold">ID</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Name</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Position</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Department</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Contact</TableHead>
                                <TableHead className="text-right h-9 text-xs font-semibold">Balance (Adv)</TableHead>
                                <TableHead className="text-right h-9 text-xs font-semibold w-[80px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : staffList.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">No staff members found.</TableCell></TableRow>
                            ) : (
                                staffList.map((staff) => (
                                    <TableRow key={staff._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                        <TableCell className="font-mono text-xs py-2 font-medium">{staff.employeeId}</TableCell>
                                        <TableCell className="py-2 font-medium text-sm">{staff.name}</TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground">{staff.position}</TableCell>
                                        <TableCell className="py-2"><Badge variant="outline" className="font-normal text-xs bg-slate-50 text-slate-600 border-slate-200">{staff.department}</Badge></TableCell>
                                        <TableCell className="text-muted-foreground text-xs py-2">{staff.phone}</TableCell>
                                        <TableCell className="text-right font-mono text-xs py-2">
                                            {staff.currentAdvance > 0 ? <span className="text-orange-600 font-medium">₹{staff.currentAdvance.toLocaleString()}</span> : <span className="text-slate-300">-</span>}
                                        </TableCell>
                                        <TableCell className="py-2 text-right">
                                            <Link href={`/dashboard/staff/${staff._id}`}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Footer */}
                <div className="p-4 border-t grid grid-cols-3 sm:grid-cols-3 items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                            Rows
                        </p>
                        <Input
                            type="number"
                            min="1"
                            className="h-8 w-[70px]"
                            value={limit}
                            onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (val > 0) {
                                    setLimit(val)
                                    setPage(1)
                                }
                            }}
                        />
                    </div>

                    <div className="hidden md:flex items-center justify-center text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>

                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>Enter employee details below.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input placeholder="EMP001" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="joinDate" render={({ field }) => (<FormItem><FormLabel>Join Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="dob" render={({ field }) => (<FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><FormControl><Input placeholder="Cleaning, Security..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="Supervisor..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="baseSalary" render={({ field }) => (<FormItem><FormLabel>Monthly Salary</FormLabel><FormControl><div className="relative"><Input type="number" className="pl-6 font-bold" {...field} value={field.value ?? ''} /><span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span></div></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />

                            <DialogFooter>
                                <Button type="submit">Create Staff Member</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
