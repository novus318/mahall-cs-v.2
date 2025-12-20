'use client';

// (imports remain same, need to add useEffect)
// (previous imports)
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Pencil, X, Check } from 'lucide-react';
import api from '@/lib/axios';

// (schemas remain same)
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
                    profileForm.reset({
                        name: data.data.name || "",
                        contactNumber: data.data.contactNumber || "",
                    });
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

    if (isFetching) return <div className="p-4 text-sm text-muted-foreground">Loading profile...</div>;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Information */}
            <div className="space-y-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-medium">Personal Information</h3>
                            <p className="text-xs text-muted-foreground">Your public profile details.</p>
                        </div>
                        {!isEditingProfile && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)} className="h-8 w-8 p-0">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {!isEditingProfile ? (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                                <p className="text-sm font-medium">{profileForm.getValues("name") || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground">Contact Number</span>
                                <p className="text-sm font-medium">{profileForm.getValues("contactNumber") || "-"}</p>
                            </div>
                        </div>
                    ) : (
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} className="h-9 text-sm" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="contactNumber"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Contact Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1234567890" {...field} className="h-9 text-sm" />
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
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoadingProfile} size="sm">
                                        {isLoadingProfile ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="space-y-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
                    <div className="mb-4">
                        <h3 className="text-base font-medium">Change Password</h3>
                        <p className="text-xs text-muted-foreground">Set a new password for your account.</p>
                    </div>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            {/* Current Password Field Removed */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="********" {...field} className="h-9 text-sm" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="********" {...field} className="h-9 text-sm" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" variant="secondary" disabled={isLoadingPassword} size="sm">
                                    {isLoadingPassword ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
