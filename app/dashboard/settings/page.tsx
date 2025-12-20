'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileTab from '@/components/settings/ProfileTab';
import UserManagementTab from '@/components/settings/UserManagementTab';
import NotificationSettingsTab from '@/components/settings/NotificationSettingsTab';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { user, loading } = useAuth();

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    </div>;
    if (!user) return <div className="p-8 text-center text-red-500">Failed to load user profile.</div>;

    return (
        <div className="container max-w-screen-2xl mx-auto py-6 px-4 sm:px-6">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col md:flex-row gap-6 md:gap-8">

                {/* Sidebar Navigation */}
                <aside className="w-full md:w-56 lg:w-64 shrink-0 space-y-4">
                    <div className="px-1">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">Settings</h1>
                        <p className="text-sm text-muted-foreground">Manage system preferences.</p>
                    </div>

                    <TabsList className="flex flex-col h-auto w-full items-stretch bg-transparent p-0 gap-1 text-sm">
                        <TabsTrigger
                            value="profile"
                            className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:text-foreground font-normal hover:bg-muted/50 rounded-md transition-colors text-muted-foreground"
                        >
                            Profile & Security
                        </TabsTrigger>
                        {user.role === 'admin' && (
                            <>
                                <TabsTrigger
                                    value="users"
                                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:text-foreground font-normal hover:bg-muted/50 rounded-md transition-colors text-muted-foreground"
                                >
                                    User Management
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notifications"
                                    className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted data-[state=active]:text-foreground font-normal hover:bg-muted/50 rounded-md transition-colors text-muted-foreground"
                                >
                                    Notification Contacts
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </aside>

                {/* Content Area */}
                <div className="flex-1 max-w-4xl min-w-0">
                    <TabsContent value="profile" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                        <div className="mb-4 hidden md:block border-b pb-2">
                            <h2 className="text-lg font-medium">Profile & Security</h2>
                            <p className="text-xs text-muted-foreground">Manage your personal details and authentication.</p>
                        </div>
                        <ProfileTab />
                    </TabsContent>

                    {user.role === 'admin' && (
                        <>
                            <TabsContent value="users" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <div className="mb-4 hidden md:block border-b pb-2">
                                    <h2 className="text-lg font-medium">User Management</h2>
                                    <p className="text-xs text-muted-foreground">Control system access and user roles.</p>
                                </div>
                                <UserManagementTab />
                            </TabsContent>

                            <TabsContent value="notifications" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <div className="mb-4 hidden md:block border-b pb-2">
                                    <h2 className="text-lg font-medium">Notification Contacts</h2>
                                    <p className="text-xs text-muted-foreground">Configure recipients for system alerts.</p>
                                </div>
                                <NotificationSettingsTab />
                            </TabsContent>
                        </>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
