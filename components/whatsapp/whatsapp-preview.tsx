'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppText } from '@/components/whatsapp/format-whatsapp';
import { TemplateState, TemplateButton } from '@/lib/whatsapp-template';
import { Globe, Phone, Copy, Video, FileText } from 'lucide-react';

function MediaIcon({ type }: { type: string }) {
    if (type === 'VIDEO') return <Video className="size-4" />;
    if (type === 'DOCUMENT') return <FileText className="size-4" />;
    return null;
}

interface PreviewProps {
    state: TemplateState;
    className?: string;
}

export function WhatsAppPreview({ state, className }: PreviewProps) {
    const vars = { ...state.examples };

    return (
        <div className={cn('flex flex-col rounded-2xl border border-border bg-background', className)}>
            {/* Phone chrome */}
            <div className="flex items-center gap-2 rounded-t-2xl bg-primary/10 px-3 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm">TMJ</div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">Thayineri Muslim Jama-ath</p>
                    <p className="text-xs text-muted-foreground">online</p>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex flex-1 flex-col gap-1 p-3 bg-[#efeae2]">
                <div className="mx-auto mb-1 rounded-full bg-[#fff3c4]/80 px-3 py-1 text-[11px] text-[#54656f] shadow-sm">
                    Today
                </div>

                <MessageBubble state={state} vars={vars} />

                <div className="flex items-center justify-end gap-1 pl-8 text-[10px] text-[#54656f]">
                    <span>always forward</span>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ state, vars }: { state: TemplateState; vars: Record<string, string> }) {
    const hasHeaderText = state.headerText.trim().length > 0;
    const showMedia = state.headerType !== 'TEXT';

    const headerText =
        state.headerText || (state.headerType === 'TEXT' ? '' : `[${state.headerType.toLowerCase()} sample]`);

    const buttons = (state.buttons || []).filter(isValidButton);

    return (
        <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-2.5 shadow-sm">
            {/* Media */}
            {showMedia && state.mediaPreview && state.headerType === 'IMAGE' ? (
                <img
                    src={state.mediaPreview}
                    alt="header"
                    className="mb-1 max-h-40 w-full rounded-lg object-cover"
                />
            ) : showMedia ? (
                <div className="mb-1 flex items-center gap-2 rounded-lg bg-black/5 px-2 py-3 text-[11px] font-semibold text-[#54656f]">
                    <MediaIcon type={state.headerType} />
                    {state.headerType === 'DOCUMENT' ? 'Sample document.pdf' : 'Sample video'}
                </div>
            ) : null}

            {/* Text header */}
            {state.headerType === 'TEXT' && hasHeaderText && (
                <p className={cn('text-[15px] font-bold leading-snug text-[#111b21]', showMedia && 'mb-1')}>
                    <WhatsAppText text={headerText} />
                </p>
            )}

            {/* Body */}
            <p className="mt-1 text-[13px] leading-[1.35] text-[#111b21]">
                <WhatsAppText text={state.body || 'Your message body will appear here.'} variables={vars} />
            </p>

            {/* Footer */}
            {state.footer && (
                <p className="mt-1.5 text-[11px] leading-snug text-[#667781]">{state.footer}</p>
            )}

            {/* Buttons */}
            {buttons.length > 0 && (
                <div className="mt-2 flex flex-col overflow-hidden rounded-lg border border-[#54656f]/20">
                    {buttons.map((b) => (
                        <div
                            key={b.id}
                            className="flex items-center justify-center gap-1.5 border-b border-[#54656f]/15 bg-white py-2 text-[12.5px] font-medium text-[#005c4b] last:border-b-0"
                        >
                            <ButtonLabel button={b} />
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-1 flex h-3 items-center justify-end gap-0.5">
                <TimeStamp />
            </div>
        </div>
    );
}

function ButtonLabel({ button }: { button: TemplateButton }) {
    const label = button.text;
    switch (button.type) {
        case 'PHONE':
            return (
                <>
                    <Phone className="size-3.5" /> {label || 'Call'}
                </>
            );
        case 'COPY':
            return (
                <>
                    <Copy className="size-3.5" /> {label || 'Copy code'}
                </>
            );
        case 'URL':
            return (
                <>
                    <Globe className="size-3.5" /> {label || 'Visit website'}
                </>
            );
        default:
            return <span>{label || 'Reply'}</span>;
    }
}

function isValidButton(b: TemplateButton): boolean {
    if (b.type === 'QUICK_REPLY') return b.text.trim().length > 0;
    if (b.type === 'URL') return b.text.trim().length > 0;
    if (b.type === 'PHONE') return b.text.trim().length > 0;
    if (b.type === 'COPY') return b.text.trim().length > 0;
    return false;
}

function TimeStamp() {
    const now = new Date();
    const t = now.toTimeString().slice(0, 5);
    return (
        <span className="flex items-center gap-0.5 text-[10px] text-[#667781]">
            {t}
            <svg viewBox="0 0 16 12" className="size-3 text-[#53bdeb]" fill="currentColor">
                <path d="M11.8 1.6 5.4 8l-1.4-1.4L4.6 6 5.4 6.8 11.8 1.6zM15.5 1.1" opacity="0" />
                <path d="M10.6 8l.7-.7L15.4 3.1l-1-1-4.4 4.5zM7.9 11.3 1.4 4.8l-1 1L7.9 13.2z" />
            </svg>
        </span>
    );
}