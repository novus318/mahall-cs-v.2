'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Loader2, Save, Play, AlertCircle, ReceiptText, CalendarClock, Home, Users, Hash, Tag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CollectionSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null); // 'House', 'Member', or null
    const [settings, setSettings] = useState({
        receiptPrefix: 'MC-',
        receiptCurrentNumber: 1,
        automationEnabled: false,
        houseCronDay: 1,
        memberCronDay: 1,
        houseCronTime: '10:00',
        memberCronTime: '10:00'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings/collections');
            if (data.status) {
                setSettings({
                    ...data.data,
                    houseCronTime: data.data.houseCronTime || '10:00',
                    memberCronTime: data.data.memberCronTime || '10:00'
                });
            }
        } catch (error) {
            toast.error("Failed to load collection settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings/collections', settings);
            toast.success("Collection settings updated");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async (type: 'House' | 'Member', frequency: 'Monthly' | 'Yearly' = 'Monthly') => {
        setGenerating(`${type}-${frequency}`);
        try {
            const { data } = await api.post('/collections/generate/bulk', {
                entityType: type,
                frequency: frequency
            });
            if (data.status) {
                toast.success(data.message);
                toast.info(`Generated: ${data.data.generated}, Skipped: ${data.data.skipped}`);
            } else {
                toast.error(data.message || "Failed to generate dues");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to trigger generation");
        } finally {
            setGenerating(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

    const nextNumber = `${settings.receiptPrefix}${String(settings.receiptCurrentNumber).padStart(3, '0')}`;

    return (
        <div className="space-y-4">
            {/* Receipt Settings */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <ReceiptText className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Collection Receipt Settings</h3>
                        <p className="text-xs text-muted-foreground">Configuration for collection receipt numbering.</p>
                    </div>
                </div>
                <div className="p-5 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-medium"><Tag className="h-3 w-3 text-muted-foreground" /> Receipt Prefix</Label>
                            <Input
                                value={settings.receiptPrefix}
                                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                                placeholder="MC-"
                                className="h-9 bg-background font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-medium"><Hash className="h-3 w-3 text-muted-foreground" /> Next Sequence Number</Label>
                            <Input
                                type="number"
                                value={settings.receiptCurrentNumber}
                                onChange={(e) => setSettings({ ...settings, receiptCurrentNumber: parseInt(e.target.value) || 1 })}
                                className="h-9 bg-background font-mono"
                            />
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Next collection receipt: <span className="inline-flex items-center rounded border border-chart-2/20 bg-chart-2/10 px-1.5 py-0.5 font-mono font-semibold text-chart-2">{nextNumber}</span>
                    </p>
                </div>
            </div>

            {/* Automation Settings */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
                        <CalendarClock className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Automation Settings</h3>
                        <p className="text-xs text-muted-foreground">Configure automatic monthly due generation.</p>
                    </div>
                </div>
                <div className="p-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">Enable Auto-Generation</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically generate monthly dues on scheduled days.
                            </p>
                        </div>
                        <Switch
                            checked={settings.automationEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, automationEnabled: checked })}
                        />
                    </div>

                    <div className="space-y-4">
                        {/* House Settings */}
                        <div className="rounded-lg border overflow-hidden">
                            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                                <Home className="h-3.5 w-3.5 text-primary" />
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">House Dues</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 p-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Generation Day</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={28}
                                        value={settings.houseCronDay}
                                        onChange={(e) => setSettings({ ...settings, houseCronDay: parseInt(e.target.value) || 1 })}
                                        disabled={!settings.automationEnabled}
                                        className="h-9 bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Day of the month to generate House dues.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Generation Time</Label>
                                    <Input
                                        type="time"
                                        value={settings.houseCronTime}
                                        onChange={(e) => setSettings({ ...settings, houseCronTime: e.target.value })}
                                        disabled={!settings.automationEnabled}
                                        className="h-9 bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Time to run generation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Member Settings */}
                        <div className="rounded-lg border overflow-hidden">
                            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                                <Users className="h-3.5 w-3.5 text-chart-3" />
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Member Dues</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 p-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Generation Day</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={28}
                                        value={settings.memberCronDay}
                                        onChange={(e) => setSettings({ ...settings, memberCronDay: parseInt(e.target.value) || 1 })}
                                        disabled={!settings.automationEnabled}
                                        className="h-9 bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Day of the month to generate Member dues.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Generation Time</Label>
                                    <Input
                                        type="time"
                                        value={settings.memberCronTime}
                                        onChange={(e) => setSettings({ ...settings, memberCronTime: e.target.value })}
                                        disabled={!settings.automationEnabled}
                                        className="h-9 bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Time to run generation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end border-t bg-muted/40 px-5 py-3 sm:px-6">
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </div>

            {/* Manual Triggers */}
            <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-chart-2/20 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <Play className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-chart-2">Manual Triggers</h3>
                        <p className="text-xs text-muted-foreground">Manually trigger the bulk generation process immediately.</p>
                    </div>
                </div>
                <div className="p-5 sm:p-6 space-y-6">
                    <Alert variant="default" className="bg-card border-border">
                        <AlertCircle className="h-4 w-4 text-chart-2" />
                        <AlertTitle className="text-sm">Note</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground">
                            This process skips entities that already have a due generated for the target period. It is safe to run multiple times.
                        </AlertDescription>
                    </Alert>

                    <div>
                        <h4 className="mb-3 text-sm font-medium">Monthly Generation (Last Month)</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleGenerate('House', 'Monthly')}
                                disabled={!!generating}
                                className="border-primary/30 text-primary hover:bg-primary/10"
                            >
                                {generating === 'House-Monthly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Run House Monthly
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleGenerate('Member', 'Monthly')}
                                disabled={!!generating}
                                className="border-chart-3/30 text-chart-3 hover:bg-chart-3/10"
                            >
                                {generating === 'Member-Monthly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Run Member Monthly
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-3 text-sm font-medium">Yearly Generation (Current Year)</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleGenerate('House', 'Yearly')}
                                disabled={!!generating}
                                className="border-primary/30 text-primary hover:bg-primary/10"
                            >
                                {generating === 'House-Yearly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Run House Yearly
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleGenerate('Member', 'Yearly')}
                                disabled={!!generating}
                                className="border-chart-3/30 text-chart-3 hover:bg-chart-3/10"
                            >
                                {generating === 'Member-Yearly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Run Member Yearly
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
