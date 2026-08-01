'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

    if (isLoading) return <div>Loading users...</div>;

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-sm font-medium">System Users</h3>
                        <p className="text-xs text-muted-foreground">Manage administrative access.</p>
                    </div>
                    <Button onClick={openAddDialog} size="sm" className="h-8 text-xs"><Plus className="mr-2 h-3.5 w-3.5" /> Add User</Button>
                </div>

                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-10 text-xs">Name</TableHead>
                                <TableHead className="h-10 text-xs">Username</TableHead>
                                <TableHead className="h-10 text-xs">Role</TableHead>
                                <TableHead className="h-10 text-right text-xs">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id} className="h-10">
                                    <TableCell className="py-2 text-sm font-medium">{user.name || '-'}</TableCell>
                                    <TableCell className="py-2 text-sm">{user.username}</TableCell>
                                    <TableCell className="py-2 text-sm capitalize">{user.role}</TableCell>
                                    <TableCell className="py-2 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)} title="Edit Details">
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPasswordDialog(user)} title="Reset Password">
                                                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteClick(user._id)} title="Delete User">
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
                    <DialogHeader>
                        <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {selectedUser ? "Modify user details." : "Create a new system user."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs">Full Name</FormLabel>
                                        <FormControl><Input placeholder="Name" {...field} className="h-8 text-sm" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs">Username</FormLabel>
                                        <FormControl><Input placeholder="username" {...field} className="h-8 text-sm" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {!selectedUser && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Password</FormLabel>
                                            <FormControl><Input type="password" placeholder="******" {...field} className="h-8 text-sm" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs">Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select a role" /></SelectTrigger>
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
                            <DialogFooter className="pt-2">
                                <Button type="submit" size="sm">Save</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription className="text-xs">
                            Enter a new password for user <strong>{selectedUser?.username}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={resetPasswordValue}
                            onChange={(e) => setResetPasswordValue(e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                    <DialogFooter>
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
