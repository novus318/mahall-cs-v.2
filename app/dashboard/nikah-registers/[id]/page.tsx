'use client';

import React, { useEffect, useState } from 'react';
import { getNikahRegisterById } from '@/lib/api';
import NikahCertificateTemplate from '@/components/nikah-registers/NikahCertificateTemplate';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Printer } from 'lucide-react';
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

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    if (!record) return <div className="p-8 text-center text-red-500">Nikah register not found.</div>;

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6 flex justify-between items-center no-print bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Nikah Certificate</h1>
                        <p className="text-sm text-muted-foreground">{record.registerNo} &mdash; {record.groomName} &amp; {record.brideName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => router.push(`/dashboard/nikah-registers/${resolvedId}/edit`)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            <div className="flex justify-center w-full overflow-auto bg-gray-50 py-8 rounded-lg border border-gray-200 shadow-inner">
                <div id="print-section" className="shadow-lg">
                    <NikahCertificateTemplate data={record} />
                </div>
            </div>
        </div>
    );
}
