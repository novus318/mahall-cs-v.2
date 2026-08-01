'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Loader2, Save, ArrowDownLeft, ArrowUpRight, Hash, Tag } from 'lucide-react';

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

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

    const paymentNext = `${settings.payment.receiptPrefix}${String(settings.payment.receiptCurrentNumber).padStart(3, '0')}`;
    const incomeNext = `${settings.income.receiptPrefix}${String(settings.income.receiptCurrentNumber).padStart(3, '0')}`;

    return (
        <div className="space-y-4">
            {/* Payment (Expense) Settings */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b bg-destructive/5 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <ArrowDownLeft className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Payment (Expense) Settings</h3>
                        <p className="text-xs text-muted-foreground">Configuration for outgoing payment vouchers.</p>
                    </div>
                </div>
                <div className="p-5 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-medium"><Tag className="h-3 w-3 text-muted-foreground" /> Receipt Prefix</Label>
                            <Input
                                value={settings.payment.receiptPrefix}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    payment: { ...settings.payment, receiptPrefix: e.target.value }
                                })}
                                placeholder="PA-"
                                className="h-9 bg-background font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Prefix for expense vouchers.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-medium"><Hash className="h-3 w-3 text-muted-foreground" /> Next Sequence Number</Label>
                            <Input
                                type="number"
                                value={settings.payment.receiptCurrentNumber}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    payment: { ...settings.payment, receiptCurrentNumber: Number(e.target.value) }
                                })}
                                className="h-9 bg-background font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Next voucher: <span className="inline-flex items-center rounded border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 font-mono font-semibold text-destructive">{paymentNext}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt (Income) Settings */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b bg-chart-1/5 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Receipt (Income) Settings</h3>
                        <p className="text-xs text-muted-foreground">Configuration for incoming receipts/donations.</p>
                    </div>
                </div>
                <div className="p-5 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-medium"><Tag className="h-3 w-3 text-muted-foreground" /> Receipt Prefix</Label>
                            <Input
                                value={settings.income.receiptPrefix}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    income: { ...settings.income, receiptPrefix: e.target.value }
                                })}
                                placeholder="RC-"
                                className="h-9 bg-background font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Prefix for income receipts.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-medium"><Hash className="h-3 w-3 text-muted-foreground" /> Next Sequence Number</Label>
                            <Input
                                type="number"
                                value={settings.income.receiptCurrentNumber}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    income: { ...settings.income, receiptCurrentNumber: Number(e.target.value) }
                                })}
                                className="h-9 bg-background font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Next receipt: <span className="inline-flex items-center rounded border border-chart-1/20 bg-chart-1/10 px-1.5 py-0.5 font-mono font-semibold text-chart-1">{incomeNext}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end border-t bg-muted/40 px-5 py-3 sm:px-6">
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
