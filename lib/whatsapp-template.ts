export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type VariableType = 'text' | 'named';
export type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE' | 'COPY';

export interface TemplateButton {
    id: string;
    type: ButtonType;
    text: string;
    url?: string;
    dynamic?: boolean;
    exampleUrl?: string;
    phoneNumber?: string;
}

export interface TemplateHeader {
    format: HeaderFormat;
    text: string;
    sample?: string;
    caption?: string;
}

export interface TemplateState {
    name: string;
    category: TemplateCategory;
    language: string;
    variableType: VariableType;
    body: string;
    footer: string;
    headerType: HeaderFormat;
    headerText: string;
    headerSample: string;
    mediaPreview: string;
    examples: Record<string, string>;
    buttons: TemplateButton[];
}

export interface CloudTemplate {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    qualityScore: number | null;
    rejectedReason?: string | null;
    lastSubmittedName?: string | null;
    parameterFormat?: 'positional' | 'named';
    header?: { format: string; text?: string; sample?: string } | null;
    body?: { text?: string; params?: { name: string; format: string; example?: string | null }[] } | null;
    footer?: string | null;
    buttons?: { type: string; text: string; url?: string; phone_number?: string }[];
}

export const CATEGORIES: { value: TemplateCategory; label: string; hint: string }[] = [
    { value: 'UTILITY', label: 'Utility', hint: 'Transactional confirmations, reminders, updates' },
    { value: 'MARKETING', label: 'Marketing', hint: 'Promotions, announcements, engagement' },
    { value: 'AUTHENTICATION', label: 'Authentication', hint: 'Login codes, OTP, account verification' },
];

export const LANGUAGES: { value: string; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'en_GB', label: 'English (UK)' },
    { value: 'ml', label: 'Malayalam' },
    { value: 'mr', label: 'Marathi' },
    { value: 'mr_IN', label: 'Marathi (India)' },
    { value: 'hi', label: 'Hindi' },
    { value: 'hi_IN', label: 'Hindi (India)' },
    { value: 'ta', label: 'Tamil' },
    { value: 'ta_IN', label: 'Tamil (India)' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ur', label: 'Urdu' },
    { value: 'ar', label: 'Arabic' },
];

export const HEADER_FORMATS: { value: HeaderFormat; label: string; hint: string }[] = [
    { value: 'TEXT', label: 'Text', hint: 'A bold text line above the body' },
    { value: 'IMAGE', label: 'Image', hint: 'JPG/PNG, up to 5 MB' },
    { value: 'VIDEO', label: 'Video', hint: 'MP4, up to 16 MB' },
    { value: 'DOCUMENT', label: 'Document', hint: 'PDF, up to 100 MB' },
];

export const HEADER_LIMITS: Record<HeaderFormat, number> = {
    TEXT: 60,
    IMAGE: 0,
    VIDEO: 0,
    DOCUMENT: 0,
};

export const BODY_LIMIT = 1024;
export const FOOTER_LIMIT = 60;
export const BUTTON_TEXT_LIMIT = 25;
export const MAX_BUTTONS = 10;

export const DEFAULT_STATE: TemplateState = {
    name: '',
    category: 'UTILITY',
    language: 'en',
    variableType: 'text',
    body: '',
    footer: '',
    headerType: 'TEXT',
    headerText: '',
    headerSample: '',
    mediaPreview: '',
    examples: {},
    buttons: [],
};

export function uid(): string {
    return Math.random().toString(36).slice(2, 10);
}

export function validateTemplate(t: TemplateState): string | null {
    if (!t.name.trim()) return 'Give your template a name';
    if (!t.body.trim()) return 'Body text is required';
    if (t.body.trim().length > BODY_LIMIT) return `Body exceeds ${BODY_LIMIT} characters`;
    if (t.variableType === 'text') {
        const vars = extractVariables(t.body);
        if (vars.length > 0 && vars.length !== maxPositionalIndex(t.body)) {
            return 'Positional variables must be numbered sequentially {{1}}, {{2}} …';
        }
    }
    if (t.headerType !== 'TEXT' && !t.headerSample.trim()) {
        return 'Upload or link a sample for the media header';
    }
    if (t.buttons.length > MAX_BUTTONS) return `At most ${MAX_BUTTONS} buttons are allowed`;
    return null;
}

export function extractVariables(text: string): string[] {
    const matches = text.match(/\{\{\s*([^}]+?)\s*\}\}/g) || [];
    return matches.map(m => m.replace(/\{\{\s*|\s*\}\}/g, '').trim()).filter(Boolean);
}

export function maxPositionalIndex(text: string): number {
    const vars = extractVariables(text);
    let max = 0;
    for (const v of vars) {
        if (/^\d+$/.test(v)) max = Math.max(max, Number(v));
    }
    return max;
}

export function containsVariables(text: string): boolean {
    return extractVariables(text).length > 0;
}