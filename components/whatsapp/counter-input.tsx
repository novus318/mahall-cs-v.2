'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CounterInputProps extends React.ComponentProps<'textarea'> {
    value: string;
    onChangeText?: (value: string) => void;
    maxLength?: number;
    rows?: number;
    placeholder?: string;
    className?: string;
    min?: boolean;
}

export const CounterInput = React.forwardRef<HTMLTextAreaElement, CounterInputProps>(
    ({ value, onChange, maxLength, rows = 4, className, min = false, ...props }, ref) => {
        const length = typeof value === 'string' ? value.length : 0;
        const nearLimit = maxLength && length >= maxLength - 1;
        return (
            <div className="relative">
                <textarea
                    ref={ref}
                    className={cn(
                        'flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                    rows={rows}
                    value={value}
                    maxLength={maxLength}
                    onChange={onChange}
                    {...props}
                />
                {maxLength ? (
                    <span
                        className={cn(
                            'pointer-events-none absolute right-2 top-2 rounded px-1 text-[11px] font-medium tabular-nums',
                            nearLimit ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                        )}
                    >
                        {length}/{maxLength}
                    </span>
                ) : null}
            </div>
        );
    }
);
CounterInput.displayName = 'CounterInput';