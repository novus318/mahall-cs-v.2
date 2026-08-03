import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormattedTextProps {
    text: string;
    variables?: Record<string, string>;
    className?: string;
}

interface Token {
    type: 'text' | 'bold' | 'italic' | 'code' | 'gap';
    value?: string;
    empty: boolean;
}

const VAR_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

function tokenize(text: string): Token[] {
    let last = 0;
    const parts: { part: string; i: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = VAR_RE.exec(text))) {
        const idx = m.index;
        if (idx > last) parts.push({ part: text.slice(last, idx), i: parts.length });
        last = idx + m[0].length;
    }
    if (last < text.length) parts.push({ part: text.slice(last), i: parts.length });

    const tokens: Token[] = [];
    for (const { part } of parts) {
        const p = part as string;
        let li = 0;
        let mm: RegExpExecArray | null;
        const rule = /(\*\*|__|\*|_|`|\{\{[^}]+\}\})/g;
        while ((mm = rule.exec(p))) {
            if (mm.index > li) tokens.push({ type: 'text', value: p.slice(li, mm.index), empty: false });
            const raw = mm[0];
            li = mm.index + raw.length;
            if (raw === '```' || raw === '`') {
                tokens.push({ type: 'code', value: '', empty: true });
            } else if (raw.startsWith('{{')) {
                tokens.push({ type: 'code', value: raw, empty: false });
            } else if (raw === '*') {
                tokens.push({ type: 'bold', value: '', empty: true });
            } else if (raw === '_') {
                tokens.push({ type: 'italic', value: '', empty: true });
            } else {
                tokens.push({ type: 'text', value: raw, empty: false });
            }
        }
        if (li < p.length) tokens.push({ type: 'text', value: p.slice(li), empty: false });
    }
    return tokens;
}

const VAR_REG = /$/;

export function formatWhatsAppText(text: string, variables?: Record<string, string>): string {
    return text
        .replace(/\{\{\s*(.*?)\s*\}\}/g, (_, k) => variables?.[k] ?? `[${k}]`)
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/```(.+?)```/g, '$1')
        .replace(/`([^`]+)`/g, '$1');
}

export function WhatsAppText({ text, variables, className }: FormattedTextProps) {
    const segments = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_|```[\s\S]*?```|`.*?`|\{\{[^}]+\}\})/g)
        .filter(s => s !== '');

    return (
        <span className={cn('whitespace-pre-wrap break-words', className)}>
            {segments.map((seg, i) => {
                const isVar = /^\{\{[^}]+\}\}$/.test(seg);
                if (isVar) {
                    const key = seg.replace(/\{\{|\}\}/g, '').trim();
                    const value = variables?.[key];
                    return (
                        <React.Fragment key={i}>
                            <span className="rounded bg-primary/15 px-1 font-semibold text-primary">
                                {value ?? key}
                            </span>{' '}
                        </React.Fragment>
                    );
                }
                if (/^```[\s\S]*```$/.test(seg)) {
                    return <code key={i} className="rounded bg-black/10 px-1 font-mono px-1 text-primary">{seg.slice(3, -3)}</code>;
                }
                if (/^`.*`$/.test(seg)) {
                    return <code key={i} className="rounded bg-black/10 px-1 font-mono text-[11px]">{seg.slice(1, -1)}</code>;
                }
                if (/^\*\*.*\*\*$/.test(seg)) {
                    return <strong key={i}>{seg.slice(2, -2)}</strong>;
                }
                if (/^__.*__$/.test(seg)) {
                    return <strong key={i}>{seg.slice(2, -2)}</strong>;
                }
                if (/^\*.*\*$/.test(seg)) {
                    return <em key={i}>{seg.slice(1, -1)}</em>;
                }
                if (/^_.*_$/.test(seg)) {
                    return <em key={i}>{seg.slice(1, -1)}</em>;
                }
                return <span key={i}>{seg}</span>;
            })}
        </span>
    );
}