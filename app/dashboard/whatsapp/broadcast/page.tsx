'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { SendHorizonal, Loader2, Trash, Eye, FileDown, FileSpreadsheet } from 'lucide-react';

interface CloudTemplate {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    parameterFormat?: 'positional' | 'named';
    header?: { format?: string; text?: string | null; sample?: string | null } | null;
    body?: { text?: string; params?: { name: string; format: 'positional' | 'named'; example?: string | null }[] } | null;
}

interface Broadcast {
    _id: string;
    name: string;
    message: string;
    messageTemplate?: { name: string; language: string; values: string[] } | null;
    audience: { type: string };
    status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
    stats: { total: number; sent: number; delivered: number; read: number; failed: number };
    createdAt: string;
}

const audienceLabels: Record<string, string> = {
    MEMBER: 'Members', TENANT: 'Tenants', STAFF: 'Staff', ALL: 'All', CUSTOM: 'Custom numbers',
};

const statusVariant: Record<Broadcast['status'], 'secondary' | 'default' | 'outline' | 'destructive'> = {
    DRAFT: 'secondary', RUNNING: 'outline', COMPLETED: 'default', PARTIAL: 'outline', FAILED: 'destructive',
};

export default function BroadcastPage() {
    const [templates, setTemplates] = useState<CloudTemplate[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loadingB, setLoadingB] = useState(true);

    const [name, setName] = useState('');
    const [audience, setAudience] = useState('ALL');
    const [mode, setMode] = useState<'text' | 'template'>('text');

    // Free text mode
    const [message, setMessage] = useState('');
    // Template mode
    const [selectedTemplateId, setSelectedTemplateId] = useState('none');
    const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
    const [templateHeaderMedia, setTemplateHeaderMedia] = useState('');
    const [customContacts, setCustomContacts] = useState('');

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;
    const paramFormat = selectedTemplate?.parameterFormat || 'positional';
    const params = selectedTemplate?.body?.params || [];
    const headerFormat = String(selectedTemplate?.header?.format || '').toUpperCase();
    const isMediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);

    const [previewing, setPreviewing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [preview, setPreview] = useState<{ total: number; text?: string; values?: Record<string, string>; templateName?: string; excluded?: number } | null>(null);
    const [saving, setSaving] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [tRes, bRes] = await Promise.all([
                api.get('/whatsapp/templates'),
                api.get('/whatsapp/broadcasts'),
            ]);
            setTemplates(tRes.data.data || []);
            setBroadcasts(bRes.data.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoadingB(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const chooseTemplate = (id: string) => {
        setSelectedTemplateId(id);
        const t = templates.find(x => x.id === id);
        if (t) {
            const seed: Record<string, string> = {};
            (t.body?.params || []).forEach(p => { seed[p.name] = p.example || ''; });
            setTemplateValues(seed);
            const hf = String(t.header?.format || '').toUpperCase();
            setTemplateHeaderMedia(['IMAGE', 'VIDEO', 'DOCUMENT'].includes(hf) && t.header?.sample ? t.header.sample : '');
        }
    };

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const isTemplate = mode === 'template' && selectedTemplate;
            if (isTemplate && selectedTemplate!.status !== 'APPROVED') {
                toast.error('Only APPROVED templates can be previewed/sent');
                setPreviewing(false);
                return;
            }
            const { data } = await api.post('/whatsapp/bulk/preview', {
                audience,
                customContacts: audience === 'CUSTOM' ? customContacts.split('\n').map(p => p.trim()).filter(Boolean) : undefined,
                message: isTemplate ? undefined : message,
                templateName: isTemplate ? selectedTemplate!.name : undefined,
                templateLanguage: isTemplate ? selectedTemplate!.language : undefined,
                templateParameterFormat: isTemplate ? paramFormat : undefined,
                templateValues: isTemplate ? templateValues : undefined,
                templateHeaderFormat: isTemplate && isMediaHeader ? headerFormat : undefined,
                templateHeaderMedia: isTemplate && isMediaHeader ? (templateHeaderMedia || selectedTemplate?.header?.sample || '') : undefined,
            });
            if (data.rendered && typeof data.rendered === 'object') {
                setPreview({ total: data.total, templateName: data.rendered.templateName, values: data.rendered.values || [], excluded: data.excluded });
            } else {
                setPreview({ total: data.total, text: data.rendered, excluded: data.excluded });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Preview failed');
        } finally {
            setPreviewing(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.post('/whatsapp/bulk/export', {
                name,
                audience,
                customContacts: audience === 'CUSTOM' ? customContacts.split('\n').map(p => p.trim()).filter(Boolean) : undefined,
            }, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name.trim() || 'recipients'}-recipients.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success('Recipients exported');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    // const [exportingAudit, setExportingAudit] = useState(false);
    // const handleAuditExport = async () => {
    //     setExportingAudit(true);
    //     try {
    //         const res = await api.post('/whatsapp/bulk/export/audit', {}, { responseType: 'blob' });
    //         const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    //         const url = URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = 'member-phone-audit.xlsx';
    //         document.body.appendChild(a);
    //         a.click();
    //         a.remove();
    //         URL.revokeObjectURL(url);
    //         toast.success('Member phone audit exported');
    //     } catch (err: any) {
    //         toast.error(err.response?.data?.message || 'Audit export failed');
    //     } finally {
    //         setExportingAudit(false);
    //     }
    // };

    const handleSend = async () => {
        if (!name.trim()) { toast.error('Give the broadcast a name'); return; }
        const isTemplate = mode === 'template';
        if (isTemplate) {
            if (!selectedTemplate) { toast.error('Select a template'); return; }
            if (selectedTemplate.status !== 'APPROVED') { toast.error('Only APPROVED templates can be sent'); return; }
        } else if (!message.trim()) {
            toast.error('Message cannot be empty'); return;
        }
        setSaving(true);
        try {
            const { data } = await api.post('/whatsapp/broadcasts', {
                name,
                audience,
                customContacts: audience === 'CUSTOM' ? customContacts.split('\n').map(p => p.trim()).filter(Boolean) : undefined,
                message: isTemplate ? '' : message,
                templateName: isTemplate ? selectedTemplate!.name : undefined,
                templateLanguage: isTemplate ? selectedTemplate!.language : undefined,
                templateParameterFormat: isTemplate ? paramFormat : undefined,
                templateValues: isTemplate ? templateValues : undefined,
                templateHeaderFormat: isTemplate && isMediaHeader ? headerFormat : undefined,
                templateHeaderMedia: isTemplate && isMediaHeader ? (templateHeaderMedia || selectedTemplate?.header?.sample || '') : undefined,
            });
            toast.success('Broadcast created. Running now...');
            await api.post(`/whatsapp/broadcasts/${data.data._id}/run`);
            toast.success('Broadcast finished');
            setPreview(null); setName(''); setMessage(''); setSelectedTemplateId('none'); setTemplateValues({}); setTemplateHeaderMedia(''); setCustomContacts('');
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send broadcast');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (b: Broadcast) => {
        if (!confirm(`Delete broadcast "${b.name}"?`)) return;
        try {
            await api.delete(`/whatsapp/broadcasts/${b._id}`);
            toast.success('Broadcast deleted');
            loadAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete broadcast');
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-6 bg-muted/40 p-4 pt-8 md:p-8 min-h-[calc(100vh-4rem)]">
            {/* Page header (Uber style) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        WhatsApp · Bulk Messaging
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Bulk Messaging</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Broadcast an approved template (or free text) to an audience with per-recipient personalisation.
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card shadow-sm max-w-xl">
                    <CardHeader className="border-b bg-muted/40 p-3 !pb-1 gap-0">
                        <CardTitle className="text-base font-semibold">Compose Broadcast</CardTitle>
                        <CardDescription className="text-xs">Choose an audience and a message, preview, then send.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-5">
                        <div className="space-y-1">
                            <Label>Broadcast name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dues reminder - August" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Audience</Label>
                                <Select value={audience} onValueChange={setAudience}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All (Members + Tenants + Staff)</SelectItem>
                                        <SelectItem value="MEMBER">Members</SelectItem>
                                        <SelectItem value="TENANT">Tenants</SelectItem>
                                        <SelectItem value="STAFF">Staff</SelectItem>
                                        <SelectItem value="CUSTOM">Custom numbers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Message type</Label>
                                <Select value={mode} onValueChange={v => setMode(v as 'text' | 'template')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Free text</SelectItem>
                                        <SelectItem value="template">Approved template</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {audience === 'CUSTOM' && (
                            <div className="space-y-1">
                                <Label>Phone numbers (one per line, with country code)</Label>
                                <Textarea rows={4} placeholder={"919876543210\n919812345678"} value={customContacts} onChange={e => setCustomContacts(e.target.value)} />
                            </div>
                        )}

                        <div className="h-px bg-border" />
                        {mode === 'text' ? (
                            <div className="space-y-1">
                                <Label>Message</Label>
                                <Textarea rows={6} value={message} onChange={e => setMessage(e.target.value)}
                                    placeholder={'Salam {{name}}, please clear your dues. - TMJ'} />
                                <p className="text-xs text-muted-foreground">Placeholders: {"{{name}}"}, {"{{phone}}"}, {"{{type}}"} (auto-filled per recipient).</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <Label>Approved template</Label>
                                    <Select value={selectedTemplateId} onValueChange={chooseTemplate}>
                                        <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Select...</SelectItem>
                                            {templates.map(t => (
                                                <SelectItem key={t.id} value={t.id} disabled={t.status !== 'APPROVED'}>
                                                    {t.name} ({t.status})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedTemplate && (
                                    <>
                                        <div className="rounded-md border bg-muted/40 p-3 text-xs">
                                            <Badge variant="outline" className="mb-1">{selectedTemplate.status}</Badge>
                                            <p className="text-muted-foreground">{selectedTemplate.language} · {selectedTemplate.category}</p>
                                            <pre className="whitespace-pre-wrap mt-1">{selectedTemplate.body?.text}</pre>
                                        </div>
                                        {isMediaHeader && (
                                            <div className="space-y-1">
                                                <Label>Header {headerFormat.toLowerCase()} (link)</Label>
                                                <Input value={templateHeaderMedia} onChange={e => setTemplateHeaderMedia(e.target.value)}
                                                    placeholder={`Public URL of the ${headerFormat.toLowerCase()} for the template header`} />
                                                <p className="text-xs text-muted-foreground">Required by Meta for media headers. Pre-filled with the template sample.</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>Body parameters ({"{{name}}"}, {"{{phone}}"}, {"{{type}}"} auto-fill)</Label>
                                            {params.map(p => (
                                                <div key={p.name} className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="shrink-0 font-mono">{"{{"}{paramFormat === 'named' ? p.name : p.name}{"}}"}</Badge>
                                                    <Input value={templateValues[p.name] || ''} onChange={e => {
                                                        setTemplateValues({ ...templateValues, [p.name]: e.target.value });
                                                    }} placeholder={`Value for ${p.name}`} />
                                                </div>
                                            ))}
                                            {params.length === 0 && <p className="text-xs text-muted-foreground">This template has no body parameters.</p>}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
                                {previewing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Eye className="mr-2 size-4" />} Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                                {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileDown className="mr-2 size-4" />} Export Recipients
                            </Button>
                            {/* <Button variant="outline" size="sm" onClick={handleAuditExport} disabled={exportingAudit}>
                                {exportingAudit ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileSpreadsheet className="mr-2 size-4" />} Export Phone Audit
                            </Button> */}
                            <Button size="sm" onClick={handleSend} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <SendHorizonal className="mr-2 size-4" />} Send Broadcast
                            </Button>
                        </div>

                        {preview && (
                            <div className="rounded-md border bg-muted/50 p-4 text-sm space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{preview.total}</Badge> recipients
                                    {preview.excluded != null && preview.excluded > 0 && (
                                        <span className="text-xs text-amber-600">
                                            ({preview.excluded} members skipped - invalid/missing phone numbers)
                                        </span>
                                    )}
                                </div>
                                {preview.templateName ? (
                                    <div className="text-xs">
                                        <div className="font-medium">Template: {preview.templateName}</div>
                                        {preview.values && Object.entries(preview.values).map(([k, v]) => (
                                            <div key={k} className="mt-1 flex gap-1 text-muted-foreground">
                                                <span className="font-mono">{'{{'}{k}{'}}'}:</span><pre className="whitespace-pre-wrap">{v}</pre>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    preview.text && <pre className="whitespace-pre-wrap text-xs bg-muted rounded p-2">{preview.text}</pre>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-3 !pb-1">
                    <div>
                        <CardTitle className="text-base font-semibold">Broadcast History</CardTitle>
                        <CardDescription className="text-xs">Recorded broadcast runs with delivery stats.</CardDescription>
                    </div>
                    {broadcasts.length > 0 && (
                        <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {broadcasts.length} runs
                        </span>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {loadingB ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : broadcasts.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">No broadcasts yet.</div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Audience</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Total</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Sent</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Failed</TableHead>
                                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {broadcasts.map(b => (
                                    <TableRow key={b._id} className="group hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">{b.name}</span>
                                                {b.messageTemplate?.name && <span className="text-[10px] text-muted-foreground">template: {b.messageTemplate.name}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge className="border-0 bg-muted/60 font-normal text-[10px] uppercase tracking-wider text-foreground/70">{b.messageTemplate?.name ? 'Template' : 'Text'}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground">{audienceLabels[b.audience.type] || b.audience.type}</span>
                                                <span className="text-[10px] text-muted-foreground">{b.audience.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant={statusVariant[b.status]}>{b.status}</Badge></TableCell>
                                        <TableCell className="tabular-nums">{b.stats.total}</TableCell>
                                        <TableCell className="tabular-nums text-chart-1">{b.stats.sent}</TableCell>
                                        <TableCell className="tabular-nums text-destructive">{b.stats.failed}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(b)}><Trash className="size-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}