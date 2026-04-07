'use client';

import React, { useEffect, useState } from 'react';
import { getCertificateById } from '@/lib/api';
import CertificateTemplate from '@/components/certificates/CertificateTemplate';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer, Edit, XCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateCertificate } from '@/lib/api';
import { toast } from 'sonner';

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resolvedId, setResolvedId] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => {
            setResolvedId(p.id);
        });
    }, [params]);

    const fetchCertificate = async () => {
        if (!resolvedId) return;
        try {
            const data = await getCertificateById(resolvedId);
            setCertificate(data);
        } catch (error) {
            console.error("Failed to fetch certificate", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificate();
    }, [resolvedId]);

    const handlePrint = () => {
        window.print();
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!resolvedId) return;
        try {
            await updateCertificate(resolvedId, { status: newStatus });
            toast.success(`Certificate ${newStatus} successfully`);
            fetchCertificate();
        } catch (error: any) {
            toast.error(error.message || `Failed to update status to ${newStatus}`);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading certificate...</div>;
    if (!certificate) return <div className="p-8 text-center text-red-500">Certificate not found.</div>;

    return (
        <div className="container mx-auto py-6 px-4">
            {/* Toolbar - Hidden during print */}
            <div className="mb-6 flex justify-between items-center no-print bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Certificate View</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">ID: {certificate.certificateNo}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${certificate.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {certificate.status || 'Approved'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(!certificate.status || certificate.status === 'Approved') ? (
                        <Button variant="destructive" onClick={() => handleStatusChange('Rejected')} className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                    ) : (
                        <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => handleStatusChange('Approved')}>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => router.push(`/dashboard/certificates/${resolvedId}/edit`)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button onClick={handlePrint} className="gap-2" disabled={certificate.status === 'Rejected'}>
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Printable Container */}
            <div className="flex justify-center w-full overflow-auto bg-gray-50 py-8 rounded-lg border border-gray-200 shadow-inner">
                <div id="print-section" className="shadow-lg">
                    <CertificateTemplate data={certificate} />
                </div>
            </div>
        </div>
    );
}
