'use client'

import React, { useEffect, useState } from 'react';
import { getDeathRegisters } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Plus, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function DeathRegistersPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getDeathRegisters();
                setRecords(data || []);
            } catch (error) {
                console.error("Failed to fetch death records", error);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Register · Deaths
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Death Register</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Record and manage death registrations.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/death-registers/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Record
                </Button>
            </div>

            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40 !pb-1 p-4">
                    <CardTitle className="text-base font-semibold">Registered Deaths</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">A list of all recorded death entries.</p>
                </CardHeader>
                <div className="p-0">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="py-12 px-4 flex flex-col items-center justify-center border-2 border-dashed rounded-none border-x-0 border-b-0 m-0">
                            <Heart className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="font-semibold text-lg">No records yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-4 text-center">No death entries have been registered. Click the button above to add one.</p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/death-registers/new')}>
                                Add First Record
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Gender</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Mahall ID</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Age</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Date of Death</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Zone</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Informer</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow
                                            key={record._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/dashboard/death-registers/${record._id}`)}
                                        >
                                            <TableCell className="font-medium">{record.name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{record.gender || '-'}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{record.mahallId || '-'}</TableCell>
                                            <TableCell>{record.age ?? '-'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{format(new Date(record.dateOfDeath), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{record.zone || '-'}</TableCell>
                                            <TableCell>{record.informerName}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/death-registers/${record._id}`)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
