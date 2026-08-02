'use client';

import React, { useEffect, useState } from 'react';
import { getNikahRegisterById } from '@/lib/api';
import NikahCertificateTemplate from '@/components/nikah-registers/NikahCertificateTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Printer, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NikahRegisterViewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resolvedId, setResolvedId] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => setResolvedId(p.id));
    }, [params]);

    useEffect(() => {
        if (!resolvedId) return;
        const fetch = async () => {
            try {
                const data = await getNikahRegisterById(resolvedId);
                setRecord(data);
            } catch (error) {
                console.error("Failed to fetch nikah register", error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [resolvedId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex flex-1 items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!record) return <div className="flex flex-1 items-center justify-center p-10 text-center text-muted-foreground">Nikah register not found.</div>;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1 sm:mt-0"><ArrowLeft className="h-5 w-5" /></Button>
                    <div>
                        <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                            Register · Nikah Certificate
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mt-2">Nikah Certificate</h2>
                        <p className="text-muted-foreground text-sm mt-1">{record.registerNo} &mdash; {record.groomName} &amp; {record.brideName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => router.push(`/dashboard/nikah-registers/${resolvedId}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button className="flex-1 sm:flex-none" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            <div className="flex justify-center w-full overflow-auto bg-card p-4 sm:p-8 rounded-lg border border-border shadow-sm">
                <div id="print-section" className="shadow-lg">
                    <NikahCertificateTemplate data={record} />
                </div>
            </div>
        </div>
    );
}
