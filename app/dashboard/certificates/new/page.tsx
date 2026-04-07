'use client';

import React from 'react';
import CertificateForm from '@/components/certificates/CertificateForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewCertificatePage() {
    const router = useRouter();

    return (
        <div className="container max-w-4xl mx-auto py-6 px-4">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Nikah Certificate</h1>
                    <p className="text-muted-foreground mt-1">Fill in the details to generate a new official document.</p>
                </div>
            </div>

            <CertificateForm />
        </div>
    );
}
