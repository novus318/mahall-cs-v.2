'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
    Plus, Trash2, Loader2, RefreshCcw, Eye, Pencil, Search,
    LayoutTemplate, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CloudTemplate } from '@/lib/whatsapp-template';

type StatusVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATUS_STYLE: Record<string, string> = {
    APPROVED: 'border-chart-1/20 bg-chart-1/10 text-chart-1',
    PENDING: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    IN_APPEAL: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    REJECTED: 'border-destructive/20 bg-destructive/10 text-destructive',
    DISABLED: 'border-slate-500/20 bg-slate-500/10 text-slate-500',
    PAUSED: 'border-slate-400/20 bg-slate-400/10 text-muted-foreground',
};

const TABS: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'AUTHENTICATION', label: 'Authentication' },
];

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<CloudTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>(null);
    const [viewing, setViewing] = useState<CloudTemplate | null>(null);
    const [wabaInput, setWabaInput] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);
    const [tab, setTab] = useState('ALL');
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const saveWaba = async () => {
        if (!wabaInput.trim()) { toast.error('Enter the WABA ID'); return; }
        setSavingConfig(true);
        try {
            const { data } = await api.post('/whatsapp/meta/config', { waba: wabaInput });
            setMeta(data.data);
            setWabaInput('');
            if (data.data?.connected) {
                toast.success('Connected to WhatsApp Business Account');
                load();
            } else {
                toast.error(data.data?.error || 'WABA saved, but the connection test failed.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save WABA');
        } finally {
            setSavingConfig(false);
        }
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const st = await api.get('/whatsapp/meta/status');
            setMeta(st.data.data);
            if (st.data.data?.configured) {
                const { data } = await api.get('/whatsapp/templates');
                setTemplates(data.data || []);
            } else {
                setTemplates([]);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load templates');
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => {
        const approved = templates.filter(t => t.status === 'APPROVED').length;
        const pending = templates.filter(t => ['PENDING', 'IN_APPEAL'].includes(t.status)).length;
        const rejected = templates.filter(t => t.status === 'REJECTED').length;
        return { total: templates.length, approved, pending, rejected };
    }, [templates]);

    const filtered = useMemo(() => {
        let list = templates;
        if (tab !== 'ALL') list = list.filter(t => t.category === tab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.language.toLowerCase().includes(q) ||
                (t.body?.text || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [templates, tab, search]);

    // const handleDelete = async (t: CloudTemplate) => {
    //     if (!window.confirm(`Delete template "${t.name}" from Meta?`)) return;
    //     setDeleting(t.id);
    //     try {
    //         await api.delete(`/whatsapp/templates/${t.id}`);
    //         toast.success('Template deleted');
    //         load();
    //     } catch (err: any) {
    //         toast.error(err.response?.data?.message || 'Failed to delete template');
    //     } finally {
    //         setDeleting(null);
    //     }
    // };

    if (!loading && meta && !meta.configured) {
        return (
            <div className="flex flex-1 flex-col gap-6 bg-muted/40 p-4 pt-8 md:p-8 min-h-[calc(100vh-4rem)]">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        WhatsApp · Templates
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight">Setup Required</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Templates are managed via the WhatsApp Cloud API.</p>
                </div>
                <Card className="max-w-xl bg-card shadow-sm">
                    <CardHeader className="border-b bg-muted/40 p-4">
                        <CardTitle className="text-base font-semibold">Connect WhatsApp Meta account</CardTitle>
                        <CardDescription className="mt-1 text-xs">Template management runs against the WhatsApp Cloud API and needs your WABA ID.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 text-sm">
                        <div>
                            <p>Token configured: <Badge variant={meta.tokenConfigured ? 'default' : 'destructive'}>{meta.tokenConfigured ? 'Yes' : 'No'}</Badge></p>
                            <p>WABA ID configured: <Badge variant={meta.wabaConfigured ? 'default' : 'destructive'}>{meta.wabaConfigured ? 'Yes' : 'No'}</Badge></p>
                            {meta.phoneId && <p>Phone number ID: <code className="rounded bg-muted px-1">{meta.phoneId}</code></p>}
                        </div>
                        {meta.tokenConfigured ? (
                            <div className="space-y-1">
                                <Label className="text-xs">WhatsApp Business Account (WABA) ID</Label>
                                <div className="flex gap-2">
                                    <Input value={wabaInput} onChange={e => setWabaInput(e.target.value)} placeholder="e.g. 102290129340398" className="bg-background" />
                                    <Button onClick={saveWaba} disabled={savingConfig}>
                                        {savingConfig ? <Loader2 className="size-4 animate-spin" /> : 'Save & test'}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Found in Meta Business Suite → WhatsApp → Business Settings. Saved to the database.
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                Add <code className="rounded bg-muted px-1">WHATSAPP_TOKEN</code> to the backend <code className="rounded bg-muted px-1">.env</code> first.
                            </p>
                        )}
                        <Button variant="outline" size="sm" onClick={load}><RefreshCcw className="mr-2 size-4" /> Refresh</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 bg-muted/40 p-4 md:p-8 min-h-[calc(100vh-4rem)]">
            {/* Page header (Uber style) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        WhatsApp · Templates
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Message Templates</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Managed via the WhatsApp Cloud API. New templates require Meta approval.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={load}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => router.push('/dashboard/whatsapp/templates/new')}>
                        <Plus className="mr-2 h-4 w-4" /> New Template
                    </Button>
                </div>
            </div>

            {/* Stats / summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total templates" value={stats.total} icon={<LayoutTemplate className="h-4 w-4" />} tone="slate" />
                <MetricCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
                <MetricCard label="Pending review" value={stats.pending} icon={<Clock className="h-4 w-4" />} tone="amber" />
                <MetricCard label="Rejected" value={stats.rejected} icon={<XCircle className="h-4 w-4" />} tone="red" />
            </div>

            {/* Filters card */}
            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40 p-3 !pb-2">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-background p-1">
                            {TABS.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setTab(t.value)}
                                    className={cn(
                                        'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                                        tab === t.value
                                            ? 'bg-accent text-accent-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search templates…"
                                    className="h-9 bg-background pl-9 text-sm md:w-72"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Table card */}
            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-3 !pb-1">
                    <div>
                        <CardTitle className="text-base font-semibold">Templates in this WABA</CardTitle>
                        <CardDescription className="text-xs">
                            {loading ? 'Loading templates…' : `${filtered.length} of ${templates.length} templates`}
                        </CardDescription>
                    </div>
                    {meta?.source && (
                        <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            WABA {meta.source}
                        </span>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Lang</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Body</TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    {templates.length === 0 ? 'No templates in this WABA yet. Create your first one.' : 'No templates match your filters.'}
                                </TableCell></TableRow>
                            ) : (
                                filtered.map(t => (
                                    <TableRow key={t.id} className="group hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">{t.name}</span>
                                                {t.header?.text && <span className="text-[10px] text-muted-foreground">#{t.header.text}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={t.status} />
                                            {t.rejectedReason && <div className="mt-1 max-w-[200px] truncate text-[10px] text-destructive">{t.rejectedReason}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="border-0 bg-muted/60 font-normal text-[10px] uppercase tracking-wider text-foreground/70">
                                                {t.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{t.language}</TableCell>
                                        <TableCell>
                                            <div className="max-w-[280px] truncate text-xs text-muted-foreground">
                                                {t.body?.text || '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setViewing(t)}>
                                                    <Eye className="size-4 text-muted-foreground" /> View
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => router.push(`/dashboard/whatsapp/templates/new?edit=${t.id}`)}>
                                                    <Pencil className="size-4 text-muted-foreground" /> Edit
                                                </Button>
                                                {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" disabled={deleting === t.id} onClick={() => handleDelete(t)}>
                                                    {deleting === t.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                                </Button> */}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ViewDialog viewing={viewing} onClose={() => setViewing(null)} />
        </div>
    );
}

function MetricCard({ label, value, icon, tone }: {
    label: string; value: number; icon: React.ReactNode; tone: 'slate' | 'green' | 'amber' | 'red';
}) {
    const tones: Record<string, string> = {
        slate: 'text-muted-foreground',
        green: 'text-chart-1',
        amber: 'text-amber-500',
        red: 'text-destructive',
    };
    return (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
            </div>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60', tones[tone])}>
                {icon}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', STATUS_STYLE[status] || 'border-border bg-muted text-muted-foreground')}>
            <span className="size-1.5 rounded-full bg-current" />
            {status.replace('_', ' ')}
        </span>
    );
}

function ViewDialog({ viewing, onClose }: { viewing: CloudTemplate | null; onClose: () => void }) {
    return (
        <Dialog open={!!viewing} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {viewing?.name}
                        {viewing && <StatusBadge status={viewing.status} />}
                    </DialogTitle>
                </DialogHeader>
                {viewing && (
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{viewing.category}</Badge>
                            <Badge variant="outline">{viewing.language}</Badge>
                            {viewing.parameterFormat && <Badge variant="outline">{viewing.parameterFormat} parameters</Badge>}
                            {viewing.qualityScore !== null && viewing.qualityScore !== undefined && <Badge variant="outline">Quality: {viewing.qualityScore}</Badge>}
                        </div>
                        {viewing.rejectedReason && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">Rejected: {viewing.rejectedReason}</div>
                        )}
                        {viewing.header?.text && (
                            <div>
                                <div className="mb-1 text-xs text-muted-foreground">Header</div>
                                <div className="rounded-md border bg-muted/40 p-2 font-semibold">{viewing.header.text}</div>
                            </div>
                        )}
                        <div>
                            <div className="mb-1 text-xs text-muted-foreground">Body</div>
                            <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-2">{viewing.body?.text}</pre>
                            {viewing.body?.params?.length ? (
                                <div className="mt-2 space-y-1">
                                    {viewing.body.params.map(p => (
                                        <div key={p.name} className="flex items-center gap-2 text-xs">
                                            <Badge variant="secondary" className="shrink-0 font-mono">{"{{"}{p.name}{"}}"}</Badge>
                                            <span className="text-muted-foreground">example: {p.example || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        {viewing.footer && (
                            <div>
                                <div className="mb-1 text-xs text-muted-foreground">Footer</div>
                                <div className="rounded-md border bg-muted/40 p-2">{viewing.footer}</div>
                            </div>
                        )}
                        {viewing.buttons && viewing.buttons.length > 0 && (
                            <div>
                                <div className="mb-1 text-xs text-muted-foreground">Buttons</div>
                                <div className="space-y-1">
                                    {viewing.buttons.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-md border bg-muted/40 p-2 text-xs">
                                            <span>{b.type}: {b.text}</span>
                                            <span className="ml-2 truncate text-muted-foreground">{b.url || b.phone_number || ''}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}