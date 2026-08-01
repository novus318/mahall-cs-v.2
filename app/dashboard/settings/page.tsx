'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRound, Users, Bell, CreditCard, CalendarClock, Home, Loader2 } from 'lucide-react';
import ProfileTab from '@/components/settings/ProfileTab';
import UserManagementTab from '@/components/settings/UserManagementTab';
import NotificationSettingsTab from '@/components/settings/NotificationSettingsTab';
import PaymentSettingsTab from '@/components/settings/PaymentSettingsTab';
import CollectionSettingsTab from '@/components/settings/CollectionSettingsTab';
import RentSettingsTab from '@/components/settings/RentSettingsTab';
import OTPVerificationDialog from '@/components/settings/OTPVerificationDialog';
import { useAuth } from '@/hooks/useAuth';

const SETTINGS_ACCESS_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const SETTINGS_SETUP_DURATION = 10 * 60 * 1000; // 10 minutes for setup mode

const NAV_ITEMS: { value: string; label: string; description: string; icon: any }[] = [
    { value: 'profile', label: 'Profile & Security', description: 'Manage your personal details and authentication.', icon: UserRound },
    { value: 'users', label: 'User Management', description: 'Control system access and user roles.', icon: Users },
    { value: 'notifications', label: 'Notification Contacts', description: 'Configure recipients for system alerts.', icon: Bell },
    { value: 'payments', label: 'Payment Configuration', description: 'Manage receipt numbering and payment settings.', icon: CreditCard },
    { value: 'collections', label: 'Collection Automation', description: 'Configure automated monthly due generation.', icon: CalendarClock },
    { value: 'rent', label: 'Rent Automation', description: 'Configure automated monthly rent invoice generation.', icon: Home },
];

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const { user, loading } = useAuth();
    const [isVerified, setIsVerified] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    useEffect(() => {
        // Check if user has valid session access
        const checkAccess = () => {
            if (user?.role === 'admin') {
                const accessTime = sessionStorage.getItem('settingsAccess');
                if (accessTime) {
                    const elapsed = Date.now() - parseInt(accessTime);
                    const isSetupMode = sessionStorage.getItem('settingsSetupMode') === 'true';
                    const duration = isSetupMode ? SETTINGS_SETUP_DURATION : SETTINGS_ACCESS_DURATION;

                    if (elapsed < duration) {
                        setIsVerified(true);
                    }
                }
            } else {
                // Non-admin users don't need OTP
                setIsVerified(true);
            }
            setCheckingAccess(false);
        };

        if (!loading) {
            checkAccess();
        }
    }, [user, loading]);

    const handleVerified = () => {
        setIsVerified(true);
    };

    const handleOTPDialogClose = () => {
        router.push('/dashboard');
    };

    if (loading || checkingAccess) return <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    </div>;
    if (!user) return <div className="p-8 text-center text-destructive">Failed to load user profile.</div>;

    // Show OTP dialog for admin users who haven't verified
    if (user.role === 'admin' && !isVerified) {
        return <OTPVerificationDialog open={!isVerified} onVerified={handleVerified} onClose={handleOTPDialogClose} />;
    }

    const visibleNavItems = user.role === 'admin' ? NAV_ITEMS : NAV_ITEMS.filter(item => item.value === 'profile');
    const activeItem = visibleNavItems.find(item => item.value === activeTab) || visibleNavItems[0];

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <div className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">Settings</div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your profile, security and system automation.</p>
            </div>

            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="rounded-xl border bg-card shadow-sm p-2">
                        <TabsList className="flex flex-col h-auto w-full items-stretch bg-transparent p-0 gap-1">
                            {visibleNavItems.map(item => (
                                <TabsTrigger
                                    key={item.value}
                                    value={item.value}
                                    className="justify-start gap-3 px-3 py-2.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium rounded-lg hover:bg-muted/50 hover:text-foreground transition-colors text-sm text-muted-foreground"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 data-[state=active]:bg-primary/15">
                                        <item.icon className="h-4 w-4" />
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Active Section Header */}
                    <div className="mb-5 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <activeItem.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">{activeItem.label}</h2>
                            <p className="text-sm text-muted-foreground">{activeItem.description}</p>
                        </div>
                    </div>

                    <TabsContent value="profile" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                        <ProfileTab />
                    </TabsContent>

                    {user.role === 'admin' && (
                        <>
                            <TabsContent value="users" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <UserManagementTab />
                            </TabsContent>

                            <TabsContent value="notifications" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <NotificationSettingsTab />
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <PaymentSettingsTab />
                            </TabsContent>

                            <TabsContent value="collections" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <CollectionSettingsTab />
                            </TabsContent>

                            <TabsContent value="rent" className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                                <RentSettingsTab />
                            </TabsContent>
                        </>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
