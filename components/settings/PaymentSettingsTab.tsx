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
        payment: {
            receiptPrefix: 'PA-',
            receiptCurrentNumber: 1
        },
        income: {
            receiptPrefix: 'RC-',
            receiptCurrentNumber: 1
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings/payments');
            if (data.data) {
                setSettings({
                    payment: data.data.paymentSettings || { receiptPrefix: 'PA-', receiptCurrentNumber: 1 },
                    income: data.data.incomeSettings || { receiptPrefix: 'RC-', receiptCurrentNumber: 1 }
                });
            }
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings/payments', {
                paymentSettings: settings.payment,
                incomeSettings: settings.income
            });
            toast.success("Settings updated successfully");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Payment (Expense) Settings</CardTitle>
                    <CardDescription>
                        Configuration for outgoing payment vouchers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Receipt Prefix</Label>
                            <Input
                                value={settings.payment.receiptPrefix}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    payment: { ...settings.payment, receiptPrefix: e.target.value }
                                })}
                                placeholder="PA-"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Prefix for expense vouchers.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Next Sequence Number</Label>
                            <Input
                                type="number"
                                value={settings.payment.receiptCurrentNumber}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    payment: { ...settings.payment, receiptCurrentNumber: Number(e.target.value) }
                                })}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Next voucher: <strong>{settings.payment.receiptPrefix}{String(settings.payment.receiptCurrentNumber).padStart(3, '0')}</strong>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Receipt (Income) Settings</CardTitle>
                    <CardDescription>
                        Configuration for incoming receipts/donations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Receipt Prefix</Label>
                            <Input
                                value={settings.income.receiptPrefix}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    income: { ...settings.income, receiptPrefix: e.target.value }
                                })}
                                placeholder="RC-"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Prefix for income receipts.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Next Sequence Number</Label>
                            <Input
                                type="number"
                                value={settings.income.receiptCurrentNumber}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    income: { ...settings.income, receiptCurrentNumber: Number(e.target.value) }
                                })}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Next receipt: <strong>{settings.income.receiptPrefix}{String(settings.income.receiptCurrentNumber).padStart(3, '0')}</strong>
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Save All Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
