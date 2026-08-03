'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TemplateContentForm } from '@/components/whatsapp/template-content-form';
import { TemplateButtonsForm } from '@/components/whatsapp/template-buttons-form';
import { WhatsAppPreview } from '@/components/whatsapp/whatsapp-preview';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    TemplateState,
    DEFAULT_STATE,
    CloudTemplate,
    validateTemplate,
    uid,
} from '@/lib/whatsapp-template';

export default function Page() {
    return (
        <React.Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="size-5 animate-spin" /></div>}>
            <NewTemplatePage />
        </React.Suspense>
    );
}

function NewTemplatePage() {
    const router = useRouter();
    const params = useSearchParams();
    const editId = params.get('edit');
    const [state, setState] = React.useState<TemplateState>(DEFAULT_STATE);
    const [saving, setSaving] = React.useState(false);
    const [meta, setMeta] = React.useState<any>(null);
    const [isEditing, setIsEditing] = React.useState<CloudTemplate | null>(null);

    React.useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/whatsapp/meta/status');
                setMeta(data.data);
            } catch { /* ignore */ }

            if (editId) {
                try {
                    const { data } = await api.get('/whatsapp/templates');
                    const found = (data.data || []).find((t: CloudTemplate) => t.id === editId);
                    if (found) {
                        setIsEditing(found);
                        setState(stateFromCloud(found));
                    }
                } catch { /* ignore */ }
            }
        })();
    }, [editId]);

    const patch = (p: Partial<TemplateState>) => setState(prev => ({ ...prev, ...p }));

    const buildPayload = () => ({
        header: state.headerType === 'TEXT'
            ? { format: 'TEXT' as const, text: state.headerText }
            : { format: state.headerType, sample: state.headerSample || 'sample' },
        bodyText: state.body,
        examples: Object.fromEntries(Object.entries(state.examples).filter(([, v]) => v)),
        footerText: state.footer,
        buttons: state.buttons.map((b) => ({
            type: b.type,
            text: b.text,
            url: b.type === 'URL' ? b.url : undefined,
            dynamic: b.type === 'URL' ? !!b.dynamic : undefined,
            exampleUrl: b.type === 'URL' && b.dynamic ? b.exampleUrl : undefined,
            phoneNumber: b.type === 'PHONE' ? b.phoneNumber : undefined,
        })),
    });

    const handleSave = async () => {
        const err = validateTemplate(state);
        if (err) {
            toast.error(err);
            return;
        }
        setSaving(true);
        const payload = buildPayload();
        try {
            if (isEditing) {
                await api.put(`/whatsapp/templates/${isEditing.id}`, payload);
                toast.success('Edits submitted — the template may re-enter review');
            } else {
                await api.post('/whatsapp/templates', {
                    ...payload,
                    name: state.name,
                    category: state.category,
                    language: state.language,
                });
                toast.success('Template created — pending Meta review');
            }
            router.push('/dashboard/whatsapp/templates');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const canSubmit = isEditing ? true : !!meta?.configured;

    return (
        <div className="flex flex-1 flex-col gap-6 bg-muted/40 p-4 pt-8 md:p-8 min-h-[calc(100vh-4rem)]">
            {/* Page header (Uber style) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        WhatsApp · Templates · {isEditing ? 'Edit' : 'Create'}
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        {isEditing ? `Edit ${isEditing.name}` : 'New Message Template'}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Build a template, preview it live, then submit for Meta review.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <Badge variant={canSubmit ? 'default' : 'secondary'} className="h-7">
                            {canSubmit ? 'WABA connected' : 'WhatsApp not configured'}
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/whatsapp/templates')}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving || (!isEditing && !canSubmit)}>
                        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isEditing ? 'Save edits' : 'Create template'}
                    </Button>
                </div>
            </div>

            {!isEditing && meta && !meta.configured && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    Templates are managed via the WhatsApp Cloud API. Connect your WABA on the Templates page before creating.
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <Card className="bg-card shadow-sm">
                        <CardHeader className="border-b bg-muted/40 p-3 !pb-1 gap-0">
                            <CardTitle className="text-base font-semibold">Content</CardTitle>
                            <CardDescription className="text-xs">Name, language, header, body and footer.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-5">
                            <TemplateContentForm state={state} onChange={patch} />
                        </CardContent>
                    </Card>
                    <Card className="bg-card shadow-sm">
                        <CardContent className="p-4">
                            <TemplateButtonsForm state={state} onChange={patch} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:sticky lg:top-6 lg:self-start">
                    <Card className="bg-card shadow-sm lg:sticky lg:top-6">
                        <CardHeader className="border-b bg-muted/40 p-3 !pb-1">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Live preview</CardTitle>
                                <span className="text-[11px] text-muted-foreground">
                                    {meta?.wabaId ? 'Connected' : 'Not connected'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <WhatsAppPreview state={state} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function stateFromCloud(t: CloudTemplate): TemplateState {
    const headerType = (t.header?.format as TemplateState['headerType']) || 'TEXT';
    return {
        ...DEFAULT_STATE,
        name: t.name,
        category: (['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(t.category) ? t.category : 'UTILITY') as TemplateState['category'],
        language: t.language || 'en',
        variableType: t.parameterFormat === 'named' ? 'named' : 'text',
        body: t.body?.text || '',
        headerType,
        headerText: headerType === 'TEXT' ? (t.header?.text || '') : '',
        headerSample: headerType !== 'TEXT' ? (t.header?.sample || '') : '',
        mediaPreview: '',
        footer: t.footer || '',
        examples: (t.body?.params || []).reduce((acc, p) => {
            acc[p.name] = p.example || '';
            return acc;
        }, {} as Record<string, string>),
        buttons: (t.buttons || []).map((b) => {
            const type = mapButtonType(b.type);
            const isDynamic = type === 'URL' && (b.url || '').includes('{{');
            return {
                id: uid(),
                type,
                text: b.text || '',
                url: type === 'URL' ? b.url || '' : undefined,
                dynamic: isDynamic,
                exampleUrl: isDynamic ? b.url : '',
                phoneNumber: b.phone_number || undefined,
            };
        }),
    };
}

function mapButtonType(type: string): TemplateState['buttons'][number]['type'] {
    switch (type) {
        case 'PHONE': return 'PHONE';
        case 'COPY_CODE': return 'COPY';
        case 'URL': return 'URL';
        default: return 'QUICK_REPLY';
    }
}