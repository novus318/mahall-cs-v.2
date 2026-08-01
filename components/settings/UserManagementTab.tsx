'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, KeyRound, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import api from '@/lib/axios';

// --- Types ---
type User = {
    _id: string;
    username: string;
    name: string;
    role: 'admin' | 'staff' | 'data-entry' | 'committee';
};

const ROLE_STYLES: Record<User['role'], string> = {
    'admin': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
    'staff': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    'data-entry': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    'committee': 'bg-muted/60 text-muted-foreground border-border',
};

// --- API Functions ---
const fetchUsers = async () => {
    const { data } = await api.get('/users');
    return data.data;
};

// --- SCHEMAS ---
const userSchema = z.object({
    username: z.string().min(3, "Username too short"),
    name: z.string().min(2, "Name too short"),
    role: z.enum(['admin', 'staff', 'data-entry', 'committee']),
    password: z.string().min(6, "Password too short").optional().or(z.literal('')),
});

// --- COMPONENT ---
export default function UserManagementTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            name: '',
            role: 'staff',
            password: '',
        },
    });

    const [resetPasswordValue, setResetPasswordValue] = useState("");

    // --- Load Users ---
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers ---
    const onSubmit = async (values: z.infer<typeof userSchema>) => {
        try {
            if (selectedUser) {
                // Update
                await api.put(`/users/${selectedUser._id}`, values);
                toast.success("User updated");
            } else {
                // Create
                if (!values.password) {
                    toast.error("Password is required for new users");
                    return;
                }
                await api.post('/users', values);
                toast.success("User created");
            }
            setIsDialogOpen(false);
            form.reset();
            setSelectedUser(null);
            loadUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteClick = (userId: string) => {
        setUserToDelete(userId);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete}`);
            toast.success("User deleted");
            loadUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        } finally {
            setUserToDelete(null);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !resetPasswordValue) return;
        try {
            await api.put(`/users/${selectedUser._id}/reset-password`, { password: resetPasswordValue });
            toast.success("Password reset successfully");
            setIsPasswordDialogOpen(false);
            setResetPasswordValue("");
            setSelectedUser(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to reset password");
        }
    };

    const openAddDialog = () => {
        setSelectedUser(null);
        form.reset({ username: '', name: '', role: 'staff', password: '' });
        setIsDialogOpen(true);
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        form.reset({ username: user.username, name: user.name, role: user.role, password: '' });
        setIsDialogOpen(true);
    };

    const openPasswordDialog = (user: User) => {
        setSelectedUser(user);
        setResetPasswordValue("");
        setIsPasswordDialogOpen(true);
    }

    const userInitials = (name: string) => name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() || "?";

    if (isLoading) return <div className="flex items-center justify-center py-16 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading users...</div>;

    return (
        <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b bg-muted/40 p-4 sm:p-5">
                    <div>
                        <h3 className="text-sm font-semibold">System Users</h3>
                        <p className="text-xs text-muted-foreground">Manage administrative access.</p>
                    </div>
                    <Button onClick={openAddDialog} size="sm" className="h-8 text-xs"><Plus className="mr-2 h-3.5 w-3.5" /> Add User</Button>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wider">User</TableHead>
                                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wider">Username</TableHead>
                                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wider">Role</TableHead>
                                <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id} className="hover:bg-muted/50">
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                {userInitials(user.name || user.username)}
                                            </div>
                                            <span className="text-sm font-medium">{user.name || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground">{user.username}</TableCell>
                                    <TableCell className="py-3">
                                        <Badge variant="outline" className={`h-5 text-[10px] font-medium uppercase tracking-wide border-0 ${ROLE_STYLES[user.role] || ROLE_STYLES.staff}`}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="flex justify-end gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEditDialog(user)} title="Edit Details">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-chart-2 hover:bg-chart-2/10" onClick={() => openPasswordDialog(user)} title="Reset Password">
                                                <KeyRound className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(user._id)} title="Delete User">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader className="border-b bg-muted/40 px-6 py-4">
                        <DialogTitle className="text-lg">{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {selectedUser ? "Modify user details." : "Create a new system user."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-medium">Full Name</FormLabel>
                                        <FormControl><Input placeholder="Name" {...field} className="h-9 text-sm bg-background" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-medium">Username</FormLabel>
                                        <FormControl><Input placeholder="username" {...field} className="h-9 text-sm bg-background" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {!selectedUser && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-medium">Password</FormLabel>
                                            <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm bg-background" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-medium">Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-9 text-sm bg-background"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="staff">Staff</SelectItem>
                                                <SelectItem value="data-entry">Data Entry</SelectItem>
                                                <SelectItem value="committee">Committee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="border-t bg-muted/40 -mx-6 -mb-4 mt-4 px-6 py-3">
                                <Button type="submit" size="sm">Save User</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader className="border-b bg-muted/40 px-6 py-4">
                        <DialogTitle className="text-lg">Reset Password</DialogTitle>
                        <DialogDescription className="text-xs">
                            Enter a new password for user <strong className="text-foreground">{selectedUser?.username}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 px-6 py-4">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={resetPasswordValue}
                            onChange={(e) => setResetPasswordValue(e.target.value)}
                            className="h-9 text-sm bg-background"
                        />
                        <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                    </div>
                    <DialogFooter className="border-t bg-muted/40 px-6 py-3">
                        <Button variant="ghost" size="sm" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} disabled={!resetPasswordValue || resetPasswordValue.length < 6} size="sm">
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
