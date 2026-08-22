'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { SendHorizonal, Loader2, Trash, Eye, ChevronDown, ChevronUp, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderRecipient {
    _id?: string;
    phoneNumber: string;
    name: string;
    entityType: 'House' | 'Member';
    customId?: string;
    period?: string;
    amount?: number;
    status: 'PENDING' | 'SENT' | 'FAILED';
    whatsappMessageId?: string;
    error?: string;
    sentAt?: string;
}

interface Reminder {
    _id: string;
    name: string;
    kind: 'DUE' | 'ARREARS';
    entityType: 'House' | 'Member' | 'All';
    period?: string;
    frequency?: string;
    status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
    recipients: ReminderRecipient[];
    stats: { total: number; sent: number; failed: number };
    createdAt: string;
}

const entityLabels: Record<string, string> = {
    All: 'All (Houses + Members)', House: 'Houses', Member: 'Members',
};

const statusVariant: Record<Reminder['status'], 'secondary' | 'default' | 'outline' | 'destructive'> = {
    DRAFT: 'secondary', RUNNING: 'outline', COMPLETED: 'default', PARTIAL: 'outline', FAILED: 'destructive',
};

const recipientStatusVariant: Record<ReminderRecipient['status'], 'secondary' | 'default' | 'destructive'> = {
    PENDING: 'secondary', SENT: 'default', FAILED: 'destructive',
};

export default function DueRemindersPage() {
    const [periods, setPeriods] = useState<string[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [entityType, setEntityType] = useState('All');
    const [period, setPeriod] = useState('ALL');
    const [frequency, setFrequency] = useState('Monthly');

    const [previewing, setPreviewing] = useState(false);
    const [sending, setSending] = useState(false);
    const [preview, setPreview] = useState<{ total: number; recipients: any[] } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        try {
            const [pRes, rRes] = await Promise.all([
                api.get('/collections/periods'),
                api.get('/reminders'),
            ]);
            const periodsData = pRes.data?.data;
            if (Array.isArray(periodsData)) setPeriods(periodsData);
            setReminders(rRes.data?.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Auto-refresh while any reminder is still processing
    useEffect(() => {
        const hasProcessing = reminders.some(r => r.status === 'DRAFT' || r.status === 'RUNNING');
        if (!hasProcessing) return;
        const interval = setInterval(loadAll, 3000);
        return () => clearInterval(interval);
    }, [reminders, loadAll]);

    const handlePreview = async () => {
        if (!period || period === 'ALL') { toast.error('Select a period'); return; }
        setPreviewing(true);
        try {
            const { data } = await api.post('/reminders/preview', {
                entityType,
                period,
                frequency,
            });
            const body = data?.data;
            setPreview({ total: body.total, recipients: body.recipients || [] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Preview failed');
        } finally {
            setPreviewing(false);
        }
    };

    const handleSend = async () => {
        if (!period || period === 'ALL') { toast.error('Select a period'); return; }
        setSending(true);
        try {
            const { data } = await api.post('/reminders/dues', {
                name: name.trim() || undefined,
                entityType,
                period,
                frequency,
            });
            const run = data?.data;
            const total = run.stats?.total ?? 0;
            toast.success(data.message || `Reminder started. Sending to ${total} recipient(s) in the background.`);
            setPreview(null); setName(''); setPeriod('ALL');
            await loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send reminder');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (r: Reminder) => {
        if (!confirm(`Delete reminder "${r.name}"?`)) return;
        try {
            await api.delete(`/reminders/${r._id}`);
            toast.success('Reminder deleted');
            if (expandedId === r._id) setExpandedId(null);
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete reminder');
        }
    };

    const failedCount = (r: Reminder) =>
        r.recipients?.filter(x => x.status === 'FAILED').length ?? r.stats.failed;

    return (
        <div className="flex flex-1 flex-col gap-6 bg-muted/40 p-4 pt-8 md:p-8 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        WhatsApp · Dues Reminders
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Dues Reminders</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Send the <span className="font-mono">due_collection</span> WhatsApp reminder to unpaid dues of a period and track every run.
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card shadow-sm max-w-xl">
                    <CardHeader className="border-b bg-muted/40 p-3 !pb-1 gap-0">
                        <CardTitle className="text-base font-semibold">Compose Reminder</CardTitle>
                        <CardDescription className="text-xs">Pick a period, preview recipients, then send.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-5">
                        <div className="space-y-1">
                            <Label>Reminder name (optional)</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. August dues reminder" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Period</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Select period...</SelectItem>
                                        {periods.map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Frequency</Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                        <SelectItem value="Yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Entity type</Label>
                            <Select value={entityType} onValueChange={setEntityType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All (Houses + Members)</SelectItem>
                                    <SelectItem value="House">Houses</SelectItem>
                                    <SelectItem value="Member">Members</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-px bg-border" />
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing || sending}>
                                {previewing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Eye className="mr-2 size-4" />} Preview
                            </Button>
                            <Button size="sm" onClick={handleSend} disabled={sending || previewing}>
                                {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <SendHorizonal className="mr-2 size-4" />} Send Reminder
                            </Button>
                        </div>

                        {preview && (
                            <div className="rounded-md border bg-muted/50 p-4 text-sm space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{preview.total}</Badge> unpaid recipient(s) for {entityLabels[entityType] || entityType}
                                </div>
                                {preview.total === 0 && (
                                    <p className="text-xs text-muted-foreground">No unpaid dues found for this period. Reminder will not be sent.</p>
                                )}
                                {preview.recipients.length > 0 && (
                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                        {preview.recipients.map((r: any, i: number) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="font-mono">{r.phoneNumber}</span>
                                                <span>{r.name}</span>
                                                <Badge variant="outline" className="border-0 bg-muted/60 font-normal">{r.entityType}</Badge>
                                            </div>
                                        ))}
                                        {preview.total > preview.recipients.length && (
                                            <p>... and {preview.total - preview.recipients.length} more</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-3 !pb-1">
                    <div>
                        <CardTitle className="text-base font-semibold">Reminder History</CardTitle>
                        <CardDescription className="text-xs">Recorded reminder runs with per-recipient delivery stats.</CardDescription>
                    </div>
                    {reminders.length > 0 && (
                        <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {reminders.length} runs
                        </span>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : reminders.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">No reminder runs yet. Send one above, or run bulk due generation.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Period</TableHead>
                                        <TableHead className="hidden font-semibold text-xs uppercase tracking-wider sm:table-cell">Type</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Total</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Sent</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Failed</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reminders.map((r) => {
                                        const isExpanded = expandedId === r._id;
                                        return (
                                            <Fragment key={r._id}>
                                                <TableRow key={r._id} className={cn("group hover:bg-muted/50", isExpanded && "bg-muted/40")}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-foreground">{r.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><span className="text-sm">{r.period || '-'}</span></TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge variant="outline" className="text-[10px] font-normal">{entityLabels[r.entityType] || r.entityType}</Badge>
                                                    </TableCell>
                                                    <TableCell><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TableCell>
                                                    <TableCell className="text-right tabular-nums">{r.stats.total}</TableCell>
                                                    <TableCell className="text-right tabular-nums text-chart-1">{r.stats.sent}</TableCell>
                                                    <TableCell className="text-right tabular-nums text-destructive">{failedCount(r)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => setExpandedId(isExpanded ? null : r._id)}
                                                                title="View recipients"
                                                            >
                                                                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(r)}>
                                                                <Trash className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow className="bg-muted/40">
                                                        <TableCell colSpan={8} className="p-0">
                                                            <div className="p-3 sm:p-4 pl-6 sm:pl-12 border-b overflow-x-auto">
                                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                                                                    <History className="h-3 w-3" /> Recipients ({r.recipients?.length || 0})
                                                                </h4>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="h-8 hover:bg-transparent">
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Name</TableHead>
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Phone</TableHead>
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Type</TableHead>
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Status</TableHead>
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Sent At</TableHead>
                                                                            <TableHead className="h-8 text-xs">Error</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {(r.recipients || []).map((rec, idx) => (
                                                                            <TableRow key={rec._id || idx} className="h-8 border-none hover:bg-muted/50">
                                                                                <TableCell className="py-1 text-xs whitespace-nowrap">
                                                                                    {rec.name}
                                                                                    {rec.customId && <span className="text-muted-foreground ml-1 font-mono">({rec.customId})</span>}
                                                                                </TableCell>
                                                                                <TableCell className="py-1 text-xs font-mono text-muted-foreground whitespace-nowrap">{rec.phoneNumber}</TableCell>
                                                                                <TableCell className="py-1 text-xs whitespace-nowrap">{rec.entityType}</TableCell>
                                                                                <TableCell className="py-1 whitespace-nowrap">
                                                                                    <Badge variant={recipientStatusVariant[rec.status]} className="text-[10px]">{rec.status}</Badge>
                                                                                </TableCell>
                                                                                <TableCell className="py-1 text-xs text-muted-foreground whitespace-nowrap">
                                                                                    {rec.sentAt ? new Date(rec.sentAt).toLocaleString() : '-'}
                                                                                </TableCell>
                                                                                <TableCell className="py-1 text-xs text-destructive max-w-[220px] truncate" title={rec.error}>{rec.error || '-'}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                        {(!r.recipients || r.recipients.length === 0) && (
                                                                            <TableRow>
                                                                                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-2">No recipients recorded.</TableCell>
                                                                            </TableRow>
                                                                        )}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}