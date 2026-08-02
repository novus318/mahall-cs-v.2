'use client';

import React, { useEffect, useState } from 'react';
import { getDeathRegisterById, API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Printer, Loader2 } from 'lucide-react';
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

    if (loading) return <div className="flex flex-1 items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!record) return <div className="flex flex-1 items-center justify-center p-10 text-center text-muted-foreground">Death record not found.</div>;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1 sm:mt-0"><ArrowLeft className="h-5 w-5" /></Button>
                    <div>
                        <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                            Register · Death Record
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mt-2">Death Record</h2>
                        <p className="text-muted-foreground text-sm mt-1">{record.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => router.push(`/dashboard/death-registers/${resolvedId}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button className="flex-1 sm:flex-none" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm bg-card">
                    <CardHeader className="border-b bg-muted/40 p-4 !pb-1">
                        <CardTitle className="text-base font-semibold">Deceased Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-border">
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Name</span>
                            <div className="font-medium text-foreground mt-1">{record.name}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Gender</span>
                            <div className="font-medium text-foreground mt-1">{record.gender || '-'}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Mahall ID</span>
                            <div className="font-medium text-foreground mt-1 font-mono">{record.mahallId || '-'}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Age</span>
                            <div className="font-medium text-foreground mt-1">{record.age ?? '-'}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Address</span>
                            <div className="font-medium text-foreground mt-1">{record.address || '-'}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card">
                    <CardHeader className="border-b bg-muted/40 p-4 !pb-1">
                        <CardTitle className="text-base font-semibold">Death & Burial</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-border">
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Date of Death</span>
                            <div className="font-medium text-foreground mt-1">{format(new Date(record.dateOfDeath), 'MMM dd, yyyy')}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Place of Death</span>
                            <div className="font-medium text-foreground mt-1">{record.placeOfDeath || '-'}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Cause of Death</span>
                            <div className="font-medium text-foreground mt-1">{record.causeOfDeath || '-'}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Date of Burial</span>
                            <div className="font-medium text-foreground mt-1">{record.dateOfBurial ? format(new Date(record.dateOfBurial), 'MMM dd, yyyy') : '-'}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Zone/Section of Qabar</span>
                            <div className="font-medium text-foreground mt-1">{record.zone || '-'}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card md:col-span-2">
                    <CardHeader className="border-b bg-muted/40 p-4 !pb-1">
                        <CardTitle className="text-base font-semibold">Informer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0">
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Name</span>
                            <div className="font-medium text-foreground mt-1">{record.informerName}</div>
                        </div>
                        <div className="px-4 sm:px-6 py-3">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Phone</span>
                            <div className="font-medium text-foreground mt-1">{record.informerPhone || '-'}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
