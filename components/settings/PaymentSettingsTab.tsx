'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Loader2, Save } from 'lucide-react';

export default function PaymentSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        receiptPrefix: 'PA-',
        receiptCurrentNumber: 1,
        receiptSequenceLimit: 999
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings/payments');
            if (data.data) {
                setSettings(data.data);
            }
        } catch (error) {
            toast.error("Failed to load payment settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings/payments', settings);
            toast.success("Payment settings updated");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };



    if (loading) return <div className="p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <Card className='py-4'>
                <CardHeader>
                    <CardTitle>Receipt Configuration</CardTitle>
                    <CardDescription>
                        Customize how payment receipt numbers are generated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Receipt Prefix</Label>
                            <Input
                                value={settings.receiptPrefix}
                                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                                placeholder="PA-"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Prefix for receipt numbers (e.g., PA-, 2024-).
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Next Receipt Number</Label>
                            <Input
                                type="number"
                                value={settings.receiptCurrentNumber}
                                onChange={(e) => setSettings({ ...settings, receiptCurrentNumber: Number(e.target.value) })}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                The number to be used for the next payment.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-md bg-muted p-4 mt-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-foreground">Next Receipt Preview</span>
                                <span className="text-muted-foreground">This is how the next receipt will look.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-bold text-primary bg-background px-3 py-1 rounded border">
                                    {settings.receiptPrefix}{String(settings.receiptCurrentNumber).padStart(3, '0')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
