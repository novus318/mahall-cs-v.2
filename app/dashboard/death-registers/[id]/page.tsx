'use client';

import React, { useEffect, useState } from 'react';
import { getDeathRegisterById, API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Edit, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function DeathRegisterViewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resolvedId, setResolvedId] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => {
            setResolvedId(p.id);
        });
    }, [params]);

    useEffect(() => {
        if (!resolvedId) return;
        const fetch = async () => {
            try {
                const data = await getDeathRegisterById(resolvedId);
                setRecord(data);
            } catch (error) {
                console.error("Failed to fetch death record", error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [resolvedId]);

    const handlePrint = () => {
        window.open(`${API_URL}/death-registers/${resolvedId}/pdf`, '_blank');
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    if (!record) return <div className="p-8 text-center text-red-500">Death record not found.</div>;

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6 flex justify-between items-center no-print bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Death Record</h1>
                        <p className="text-sm text-muted-foreground">{record.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => router.push(`/dashboard/death-registers/${resolvedId}/edit`)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Deceased Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Name:</span> {record.name}</div>
                        <div><span className="font-medium">Gender:</span> {record.gender || '-'}</div>
                        <div><span className="font-medium">Mahall ID:</span> {record.mahallId || '-'}</div>
                        <div><span className="font-medium">Age:</span> {record.age ?? '-'}</div>
                        <div><span className="font-medium">Address:</span> {record.address || '-'}</div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Death & Burial</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Date of Death:</span> {format(new Date(record.dateOfDeath), 'MMM dd, yyyy')}</div>
                        <div><span className="font-medium">Place of Death:</span> {record.placeOfDeath || '-'}</div>
                        <div><span className="font-medium">Cause of Death:</span> {record.causeOfDeath || '-'}</div>
                        <div><span className="font-medium">Date of Burial:</span> {record.dateOfBurial ? format(new Date(record.dateOfBurial), 'MMM dd, yyyy') : '-'}</div>
                        <div><span className="font-medium">Zone/Section of Qabar:</span> {record.zone || '-'}</div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Informer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div><span className="font-medium">Name:</span> {record.informerName}</div>
                        <div><span className="font-medium">Phone:</span> {record.informerPhone || '-'}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
