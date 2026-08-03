'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CounterInput } from '@/components/whatsapp/counter-input';
import { cn } from '@/lib/utils';
import {
    CATEGORIES,
    LANGUAGES,
    HEADER_FORMATS,
    BODY_LIMIT,
    FOOTER_LIMIT,
    HEADER_LIMITS,
    TemplateState,
    extractVariables,
    maxPositionalIndex,
} from '@/lib/whatsapp-template';
import {
    Bold,
    Italic,
    Strikethrough,
    Code2,
    Smile,
    Braces,
    Upload,
    Image as ImageIcon,
    Video,
    FileText,
    SeparatorHorizontal,
} from 'lucide-react';

const EMOJIS = [
    '🙂', '😀', '😍', '🥳', '😇', '😎', '🤝', '👍', '👏', '🙏',
    '❤️', '💛', '💚', '🎉', '🎊', '🔥', '⭐', '💯', '✅', '❌',
    '⚠️', '📢', '📅', '⏰', '💰', '🏦', '🏠', '📄', '📞', '👋',
];

const CAT_HINTS: Record<string, string> = {
    UTILITY: 'Transactional — receipts, reminders, updates.',
    MARKETING: 'Promotions, announcements, engagement.',
    AUTHENTICATION: 'OTP / verification codes (24hr window).',
};

interface ContentFormProps {
    state: TemplateState;
    onChange: (patch: Partial<TemplateState>) => void;
    disabled?: boolean;
}

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <Toggle size="sm" aria-label={title} onClick={(e) => { e.preventDefault(); onClick(); }}>
            {children}
        </Toggle>
    );
}

function ToolbarSeparator() {
    return <span className="mx-1 h-5 w-px bg-border" />;
}

export function TemplateContentForm({ state, onChange, disabled }: ContentFormProps) {
    const bodyRef = React.useRef<HTMLTextAreaElement>(null);

    const wrapSelection = (before: string, after = before) => {
        const el = bodyRef.current;
        const start = el?.selectionStart ?? state.body.length;
        const end = el?.selectionEnd ?? state.body.length;
        const sel = state.body.slice(start, end) || 'text';
        const next = state.body.slice(0, start) + before + sel + after + state.body.slice(end);
        onChange({ body: next });
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + before.length, start + before.length + sel.length);
        });
    };

    const insertEmoji = (emoji: string) => {
        const el = bodyRef.current;
        const start = el?.selectionStart ?? state.body.length;
        const end = el?.selectionEnd ?? state.body.length;
        const next = state.body.slice(0, start) + emoji + state.body.slice(end);
        onChange({ body: next });
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    };

    const nextVarIndex = maxPositionalIndex(state.body) + 1;
    const addVariable = () => {
        const token = state.variableType === 'named' ? '{{name}}' : `{{${nextVarIndex}}}`;
        const el = bodyRef.current;
        const start = el?.selectionStart ?? state.body.length;
        const end = el?.selectionEnd ?? state.body.length;
        const next = state.body.slice(0, start) + token + state.body.slice(end);
        onChange({ body: next });
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const handleMediaSample = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        onChange({ mediaPreview: url, headerSample: `sample-${Date.now()}` });
    };

    const variables = extractVariables(state.body);
    const headerLimit = HEADER_LIMITS[state.headerType];

    return (
        <div className="space-y-6">
            {/* Name + category + language */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="template-name">Template name</Label>
                    <Input
                        id="template-name"
                        value={state.name}
                        disabled={disabled}
                        onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        placeholder="e.g. due_reminder"
                    />
                    <p className="text-xs text-muted-foreground">Lowercase letters, numbers and underscores only.</p>
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={state.category} disabled={disabled}
                        onValueChange={(v) => onChange({ category: v as TemplateState['category'] })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{CAT_HINTS[state.category]}</p>
                </div>

                <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={state.language} disabled={disabled} onValueChange={(v) => onChange({ language: v })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Header */}
            <div className="space-y-3">
                <div>
                    <Label>Header</Label>
                    <p className="mt-1 text-xs text-muted-foreground">First line of your message, shown bold above the body.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {HEADER_FORMATS.map(hf => (
                        <button
                            key={hf.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange({ headerType: hf.value, headerText: '', headerSample: '', mediaPreview: '' })}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                                state.headerType === hf.value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-input bg-transparent text-muted-foreground hover:bg-accent'
                            )}
                        >
                            {hf.value === 'IMAGE' && <ImageIcon className="size-4" />}
                            {hf.value === 'VIDEO' && <Video className="size-4" />}
                            {hf.value === 'DOCUMENT' && <FileText className="size-4" />}
                            {hf.label}
                        </button>
                    ))}
                </div>

                {state.headerType !== 'TEXT' ? (
                    <div className="space-y-2 rounded-md border border-dashed p-3">
                        <Label htmlFor="header-sample">Sample media</Label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="header-sample"
                                accept={state.headerType === 'IMAGE' ? 'image/*' : state.headerType === 'VIDEO' ? 'video/*' : 'application/pdf'}
                                onChange={handleMediaSample}
                                disabled={disabled}
                                className="hidden"
                            />
                            <Button variant="outline" type="button" disabled={disabled}
                                onClick={() => document.getElementById('header-sample')?.click()}>
                                <Upload className="size-4" /> Upload a sample
                            </Button>
                            {state.mediaPreview && state.headerType === 'IMAGE' && (
                                <img src={state.mediaPreview} alt="header preview" className="h-10 w-10 rounded-md object-cover" />
                            )}
                            {state.mediaPreview && state.headerType !== 'IMAGE' && (
                                <span className="text-xs text-muted-foreground">Sample added</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            For Meta approval you'll provide a hosted sample URL or a media handle. The upload here is for local preview only.
                        </p>
                    </div>
                ) : (
                    <CounterInput
                        id="template-header"
                        value={state.headerText}
                        rows={1}
                        maxLength={headerLimit || undefined}
                        placeholder="Header line (optional)"
                        onChange={(e) => onChange({ headerText: e.target.value })}
                        disabled={disabled}
                    />
                )}
            </div>

            {/* Body */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Message body</Label>
                </div>
                <CounterInput
                    ref={bodyRef}
                    id="template-body"
                    value={state.body}
                    rows={6}
                    maxLength={BODY_LIMIT}
                    disabled={disabled}
                    placeholder={'Salam {{1}}, please clear your dues of {{2}} before {{3}}. Thanks — TMJ.'}
                    onChange={(e) => onChange({ body: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Toggle size="sm" aria-label="Emoji"><Smile className="size-4" /></Toggle>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <div className="grid grid-cols-6 gap-1">
                                {EMOJIS.map(emoji => (
                                    <button key={emoji} type="button"
                                        className="rounded p-1 text-xl hover:bg-accent"
                                        onClick={() => insertEmoji(emoji)}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <ToolbarButton onClick={() => wrapSelection('*')} title="Bold"><Bold className="size-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => wrapSelection('_')} title="Italic"><Italic className="size-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => wrapSelection('~')} title="Strikethrough"><Strikethrough className="size-4" /></ToolbarButton>
                    <ToolbarButton onClick={() => wrapSelection('`')} title="Monospace"><Code2 className="size-4" /></ToolbarButton>
                    <ToolbarSeparator />
                    <ToolbarButton onClick={addVariable} title="Add variable"><Braces className="size-4" /></ToolbarButton>
                </div>

                {variables.length > 0 && (
                    <div className="space-y-2">
                        <Label>Example values <span className="font-normal text-muted-foreground">(required for review)</span></Label>
                        {variables.map((v) => (
                            <div key={v} className="flex items-center gap-2">
                                <Badge variant="secondary" className="shrink-0 font-mono">{"{{"}{v}{"}}"}</Badge>
                                <Input
                                    value={state.examples[v] || ''}
                                    disabled={disabled}
                                    placeholder={`Sample for ${v}`}
                                    onChange={(e) => onChange({ examples: { ...state.examples, [v]: e.target.value } })}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <SeparatorHorizontal className="size-4 text-muted-foreground" />
                    <Label>Footer</Label>
                </div>
                <CounterInput
                    id="template-footer"
                    value={state.footer}
                    rows={1}
                    maxLength={FOOTER_LIMIT}
                    placeholder="Optional small grey text"
                    onChange={(e) => onChange({ footer: e.target.value })}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}