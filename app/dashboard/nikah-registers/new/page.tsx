'use client';

import React from 'react';
import NikahRegisterForm from '@/components/nikah-registers/NikahRegisterForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewNikahRegisterPage() {
    const router = useRouter();

    return (
        <div className="container max-w-4xl mx-auto py-6 px-4">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Nikah Register</h1>
                    <p className="text-muted-foreground mt-1">Fill in the nikah details to create a register entry. Certificate can be generated after saving.</p>
                </div>
            </div>

            <NikahRegisterForm />
        </div>
    );
}
