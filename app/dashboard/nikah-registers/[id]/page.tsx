'use client';

import React, { useEffect, useState } from 'react';
import { getNikahRegisterById, API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Edit, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

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
        window.open(`${API_URL}/nikah-registers/${resolvedId}/pdf`, '_blank');
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
                        <h1 className="text-xl font-bold tracking-tight">Nikah Register</h1>
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
                        Print Certificate
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Registration Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Register No:</span> {record.registerNo}</div>
                        <div><span className="font-medium">Date of Registration:</span> {record.dateOfRegistration ? format(new Date(record.dateOfRegistration), 'MMM dd, yyyy') : '-'}</div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Groom Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Name:</span> {record.groomName}</div>
                        <div><span className="font-medium">Father's Name:</span> {record.groomFatherName}</div>
                        <div><span className="font-medium">Address:</span> {record.groomAddress || '-'}</div>
                        <div><span className="font-medium">Mahall ID:</span> {record.groomMahallId || '-'}</div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Bride Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Name:</span> {record.brideName}</div>
                        <div><span className="font-medium">Father's Name:</span> {record.brideFatherName}</div>
                        <div><span className="font-medium">Address:</span> {record.brideAddress || '-'}</div>
                        <div><span className="font-medium">Mahall ID:</span> {record.brideMahallId || '-'}</div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Nikah Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Date of Nikah:</span> {format(new Date(record.nikahDate), 'MMM dd, yyyy')}</div>
                        <div><span className="font-medium">Time of Nikah:</span> {record.nikahTime || '-'}</div>
                        <div><span className="font-medium">Place of Nikah:</span> {record.nikahPlace}</div>
                        <div><span className="font-medium">Mahr Amount:</span> {record.mahrAmount}</div>
                        <div><span className="font-medium">Bride Guardian (Wali):</span> {record.brideGuardian}</div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Witnesses & Officiator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Witness 1:</span> {record.witness1Name}</div>
                        <div><span className="font-medium">Witness 2:</span> {record.witness2Name}</div>
                        <div><span className="font-medium">Qazi / Imam:</span> {record.qaziName}</div>
                    </CardContent>
                </Card>

                {record.remarks && (
                    <Card className='py-3'>
                        <CardHeader>
                            <CardTitle className="text-lg">Remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>{record.remarks}</div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
