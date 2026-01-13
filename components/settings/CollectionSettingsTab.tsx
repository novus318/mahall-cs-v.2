'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Loader2, Save, Play, AlertCircle } from 'lucide-react';
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

    const handleGenerate = async (type: 'House' | 'Member') => {
        setGenerating(type);
        try {
            const { data } = await api.post('/collections/generate/bulk', {
                entityType: type
            });
            if (data.status) {
                toast.success(data.message);
                // Optionally show detailed stats (generated vs skipped)
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

    if (loading) return <div className="p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Collection Receipt Settings</CardTitle>
                    <CardDescription>
                        Configuration for collection receipt numbering.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Receipt Prefix</Label>
                            <Input
                                value={settings.receiptPrefix}
                                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                                placeholder="MC-"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Next Sequence Number</Label>
                            <Input
                                type="number"
                                value={settings.receiptCurrentNumber}
                                onChange={(e) => setSettings({ ...settings, receiptCurrentNumber: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Automation Settings</CardTitle>
                    <CardDescription>
                        Configure automatic monthly due generation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Auto-Generation</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically generate monthly dues on scheduled days.
                            </p>
                        </div>
                        <Switch
                            checked={settings.automationEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, automationEnabled: checked })}
                        />
                    </div>

                    {/* House Settings */}
                    <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-md">
                        <div className="space-y-2">
                            <Label>House Generation Day</Label>
                            <Input
                                type="number"
                                min={1}
                                max={28}
                                value={settings.houseCronDay}
                                onChange={(e) => setSettings({ ...settings, houseCronDay: parseInt(e.target.value) || 1 })}
                                disabled={!settings.automationEnabled}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Day of the month to generate House dues.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>House Generation Time</Label>
                            <Input
                                type="time"
                                value={settings.houseCronTime}
                                onChange={(e) => setSettings({ ...settings, houseCronTime: e.target.value })}
                                disabled={!settings.automationEnabled}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Time to run generation.
                            </p>
                        </div>
                    </div>

                    {/* Member Settings */}
                    <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-md">
                        <div className="space-y-2">
                            <Label>Member Generation Day</Label>
                            <Input
                                type="number"
                                min={1}
                                max={28}
                                value={settings.memberCronDay}
                                onChange={(e) => setSettings({ ...settings, memberCronDay: parseInt(e.target.value) || 1 })}
                                disabled={!settings.automationEnabled}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Day of the month to generate Member dues.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Member Generation Time</Label>
                            <Input
                                type="time"
                                value={settings.memberCronTime}
                                onChange={(e) => setSettings({ ...settings, memberCronTime: e.target.value })}
                                disabled={!settings.automationEnabled}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Time to run generation.
                            </p>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Save Settings
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/10 py-3">
                <CardHeader>
                    <CardTitle className="text-orange-700 dark:text-orange-400">Manual Triggers</CardTitle>
                    <CardDescription>
                        Manually trigger the bulk generation process immediately. This will check all monthly subscribers and generate missing dues for the <strong>Last Month</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="default" className="bg-white dark:bg-black">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                            This process skips entities that already have a due generated for the target period. It is safe to run multiple times.
                        </AlertDescription>
                    </Alert>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            variant="outline"
                            onClick={() => handleGenerate('House')}
                            disabled={!!generating}
                        >
                            {generating === 'House' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Run House Generation
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleGenerate('Member')}
                            disabled={!!generating}
                        >
                            {generating === 'Member' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Run Member Generation
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
