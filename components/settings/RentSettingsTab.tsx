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

export default function RentSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [settings, setSettings] = useState({
        receiptPrefix: 'RNT-',
        receiptCurrentNumber: 1,
        automationEnabled: false,
        cronDay: 1,
        cronTime: '10:00'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings/rent');
            if (data.status) {
                setSettings({
                    ...data.data,
                    cronTime: data.data.cronTime || '10:00'
                });
            }
        } catch (error) {
            toast.error("Failed to load rent settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings/rent', settings);
            toast.success("Rent settings updated");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data } = await api.post('/contracts/generate/bulk', {});
            if (data.status) {
                toast.success(data.message);
                toast.info(`Generated: ${data.data.generated}, Skipped: ${data.data.skipped}`);
            } else {
                toast.error(data.message || "Failed to generate rents");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to trigger generation");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Rent Receipt Settings</CardTitle>
                    <CardDescription>
                        Configuration for rent receipt numbering.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Receipt Prefix</Label>
                            <Input
                                value={settings.receiptPrefix}
                                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                                placeholder="RNT-"
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
                        Configure automatic monthly rent generation for active contracts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Auto-Generation</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically generate monthly rents on scheduled day.
                            </p>
                        </div>
                        <Switch
                            checked={settings.automationEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, automationEnabled: checked })}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-md">
                        <div className="space-y-2">
                            <Label>Generation Day</Label>
                            <Input
                                type="number" min={1} max={28}
                                value={settings.cronDay}
                                onChange={(e) => setSettings({ ...settings, cronDay: parseInt(e.target.value) || 1 })}
                                disabled={!settings.automationEnabled}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Day of the month to generate rent invoices.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Generation Time</Label>
                            <Input
                                type="time"
                                value={settings.cronTime}
                                onChange={(e) => setSettings({ ...settings, cronTime: e.target.value })}
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
                    <CardTitle className="text-orange-700 dark:text-orange-400">Manual Trigger</CardTitle>
                    <CardDescription>
                        Manually trigger the bulk rent generation process immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert variant="default" className="bg-white dark:bg-black">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                            Generates rent invoices for the previous month. Skips contracts that already have an invoice for that period.
                        </AlertDescription>
                    </Alert>

                    <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        Run Rent Generation
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
