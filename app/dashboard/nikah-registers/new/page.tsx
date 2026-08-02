'use client';

import React from 'react';
import NikahRegisterForm from '@/components/nikah-registers/NikahRegisterForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewNikahRegisterPage() {
    const router = useRouter();

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)] max-w-5xl w-full">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1 sm:mt-0"><ArrowLeft className="h-5 w-5" /></Button>
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Register · New Nikah
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mt-2">New Nikah Register</h2>
                    <p className="text-muted-foreground text-sm mt-1">Fill in the nikah details to create a register entry. Certificate can be generated after saving.</p>
                </div>
            </div>

            <NikahRegisterForm />
        </div>
    );
}
