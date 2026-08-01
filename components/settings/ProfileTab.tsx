'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Pencil, X, Check, UserRound, ShieldCheck, Mail, Phone, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

const profileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    contactNumber: z.string().optional(),
});

const passwordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ProfileTab() {
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // Profile Form
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            contactNumber: "",
        },
    });

    // Password Form
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Fetch initial data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/users/profile');
                if (data.status) {
                    const profile = data.data;
                    profileForm.reset({
                        name: profile.name || "",
                        contactNumber: profile.contactNumber || "",
                    });
                    setUsername(profile.username || "");
                    setEmail(profile.email || "");
                }
            } catch (error) {
                toast.error("Failed to load profile data");
            } finally {
                setIsFetching(false);
            }
        };
        fetchProfile();
    }, [profileForm]);

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        setIsLoadingProfile(true);
        try {
            await api.put('/users/profile', values);
            toast.success("Profile updated successfully");
            setIsEditingProfile(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoadingProfile(false);
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setIsLoadingPassword(true);
        try {
            await api.put('/users/profile/password', {
                newPassword: values.newPassword
            });
            toast.success("Password changed successfully");
            passwordForm.reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setIsLoadingPassword(false);
        }
    }

    if (isFetching) return <div className="flex items-center justify-center py-16 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading profile...</div>;

    const initials = (profileForm.getValues("name") || username || "U").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() || "U";

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Information */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Personal Information</h3>
                        <p className="text-xs text-muted-foreground">Your public profile details.</p>
                    </div>
                    {!isEditingProfile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditingProfile(true)}
                            className="ml-auto h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Edit profile"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="p-5 sm:p-6">
                    {!isEditingProfile ? (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary ring-4 ring-primary/10">
                                    {initials}
                                </div>
                                <div>
                                    <p className="text-base font-semibold">{profileForm.getValues("name") || "-"}</p>
                                    <p className="text-xs text-muted-foreground">{username ? `@${username}` : 'System user'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <Phone className="h-3 w-3" /> Contact Number
                                    </div>
                                    <p className="text-sm font-medium">{profileForm.getValues("contactNumber") || "Not set"}</p>
                                </div>
                                <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <Mail className="h-3 w-3" /> Username
                                    </div>
                                    <p className="text-sm font-medium">{username || "Not set"}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-medium">Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} className="h-9 text-sm bg-background" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="contactNumber"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-medium">Contact Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1234567890" {...field} className="h-9 text-sm bg-background" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        profileForm.reset();
                                        setIsEditingProfile(false);
                                    }}>
                                        <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoadingProfile} size="sm">
                                        {isLoadingProfile ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden h-fit">
                <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Security</h3>
                        <p className="text-xs text-muted-foreground">Set a new password for your account.</p>
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-medium">New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm bg-background" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-medium">Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} className="h-9 text-sm bg-background" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                                <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-chart-1" /> Password must be at least 6 characters long.</p>
                            </div>

                            <div className="flex justify-end pt-1">
                                <Button type="submit" variant="secondary" disabled={isLoadingPassword} size="sm">
                                    {isLoadingPassword ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
