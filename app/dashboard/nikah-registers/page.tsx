'use client'

import React, { useEffect, useState } from 'react';
import { getNikahRegisters } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function NikahRegistersPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getNikahRegisters();
                setRecords(data || []);
            } catch (error) {
                console.error("Failed to fetch nikah registers", error);
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
                        Register · Nikah
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Nikah Register</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Register and manage nikah records. Certificates are generated from register data.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/nikah-registers/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Register
                </Button>
            </div>

            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40 !pb-1 p-4">
                    <CardTitle className="text-base font-semibold">Registered Nikahs</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">A list of all nikah register entries.</p>
                </CardHeader>
                <div className="p-0">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="py-12 px-4 flex flex-col items-center justify-center border-2 border-dashed rounded-none border-x-0 border-b-0 m-0">
                            <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="font-semibold text-lg">No records yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-4 text-center">No nikah registrations yet. Click the button above to create one.</p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/nikah-registers/new')}>
                                Create First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Register No.</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Groom</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Bride</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Nikah Date</TableHead>
                                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Place</TableHead>
                                        <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((r) => (
                                        <TableRow
                                            key={r._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/dashboard/nikah-registers/${r._id}`)}
                                        >
                                            <TableCell className="font-medium font-mono">{r.registerNo}</TableCell>
                                            <TableCell className="font-medium">{r.groomName}</TableCell>
                                            <TableCell>{r.brideName}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{format(new Date(r.nikahDate), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{r.nikahPlace}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/nikah-registers/${r._id}`)}>
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
