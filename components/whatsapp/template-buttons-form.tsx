'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TemplateState, TemplateButton, ButtonType, MAX_BUTTONS, BUTTON_TEXT_LIMIT, uid } from '@/lib/whatsapp-template';
import { Plus, Trash2, Globe, Phone, Copy, ListChecks, MessageSquareText } from 'lucide-react';

const BUTTON_TYPES: { type: ButtonType; label: string; icon: React.ReactNode; hint: string }[] = [
    { type: 'QUICK_REPLY', label: 'Quick reply', icon: <MessageSquareText className="size-4" />, hint: 'User taps a preset reply' },
    { type: 'URL', label: 'Website', icon: <Globe className="size-4" />, hint: 'Button that opens a URL' },
    { type: 'PHONE', label: 'Call', icon: <Phone className="size-4" />, hint: 'Dial a phone number' },
    { type: 'COPY', label: 'Coupon code', icon: <Copy className="size-4" />, hint: 'Copies an offer/coupon code' },
];

interface ButtonsFormProps {
    state: TemplateState;
    onChange: (patch: Partial<TemplateState>) => void;
    disabled?: boolean;
}

export function TemplateButtonsForm({ state, onChange, disabled }: ButtonsFormProps) {
    const buttons = state.buttons ?? [];
    const canAdd = buttons.length < MAX_BUTTONS;

    const addButton = (type: ButtonType) => {
        if (!canAdd) return;
        onChange({ buttons: [...buttons, { id: uid(), type, text: '', url: '', exampleUrl: '', phoneNumber: '' }] });
    };

    const patchButton = (id: string, patch: Partial<TemplateButton>) => {
        onChange({ buttons: buttons.map(b => (b.id === id ? { ...b, ...patch } : b)) });
    };

    const removeButton = (id: string) => {
        onChange({ buttons: buttons.filter(b => b.id !== id) });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Label>Buttons</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Up to {MAX_BUTTONS} buttons. Combine at most 2 call-to-action buttons with quick replies.
                    </p>
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {buttons.length}/{MAX_BUTTONS}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BUTTON_TYPES.map(bt => (
                    <button
                        key={bt.type}
                        type="button"
                        disabled={disabled || !canAdd}
                        onClick={() => addButton(bt.type)}
                        className={cn(
                            'flex flex-col items-center gap-1 rounded-md border border-dashed p-2.5 text-xs font-medium transition-colors',
                            canAdd
                                ? 'border-input text-muted-foreground hover:border-primary hover:text-primary'
                                : 'opacity-40'
                        )}
                    >
                        {bt.icon}
                        {bt.label}
                    </button>
                ))}
            </div>

            {buttons.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-md border border-dashed bg-muted/30 py-8 text-center">
                    <ListChecks className="size-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No buttons yet. Add quick replies or call-to-action buttons above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {buttons.map((b) => (
                        <div key={b.id} className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className="gap-1">
                                    {BUTTON_TYPES.find(t => t.type === b.type)?.icon}
                                    {BUTTON_TYPES.find(t => t.type === b.type)?.label}
                                </Badge>
                                <Button variant="ghost" size="icon" disabled={disabled} onClick={() => removeButton(b.id)}>
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Button text</Label>
                                    <Input
                                        value={b.text}
                                        disabled={disabled}
                                        maxLength={BUTTON_TEXT_LIMIT}
                                        placeholder={typePlaceholder(b.type)}
                                        onChange={(e) => patchButton(b.id, { text: e.target.value })}
                                    />
                                </div>

                                {b.type === 'URL' && (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs">URL</Label>
                                            <Input
                                                value={b.url}
                                                disabled={disabled}
                                                placeholder="https://example.com"
                                                onChange={(e) => patchButton(b.id, { url: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 sm:col-span-2">
                                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={!!b.dynamic}
                                                    disabled={disabled}
                                                    onChange={(e) => patchButton(b.id, { dynamic: e.target.checked, exampleUrl: e.target.checked ? b.exampleUrl || '' : '' })}
                                                    className="size-3.5 accent-primary"
                                                />
                                                Dynamic URL (appends a parameter like {"{{1}}"})
                                            </label>
                                        </div>
                                        {b.dynamic && (
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label className="text-xs">Example URL (for review)</Label>
                                                <Input
                                                    value={b.exampleUrl}
                                                    disabled={disabled}
                                                    placeholder="https://example.com/code/12345"
                                                    onChange={(e) => patchButton(b.id, { exampleUrl: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {b.type === 'PHONE' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">Phone number (with country code)</Label>
                                        <Input
                                            value={b.phoneNumber}
                                            disabled={disabled}
                                            placeholder="+919000000000"
                                            onChange={(e) => patchButton(b.id, { phoneNumber: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function typePlaceholder(type: ButtonType): string {
    switch (type) {
        case 'QUICK_REPLY': return 'e.g. View details';
        case 'URL': return 'e.g. Visit site';
        case 'PHONE': return 'e.g. Call office';
        case 'COPY': return 'e.g. Copy code';
    }
}