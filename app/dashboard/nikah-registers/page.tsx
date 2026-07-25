'use client'

import React, { useEffect, useState } from 'react';
import { getNikahRegisters } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Plus, Eye } from 'lucide-react';
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
        <div className="container mx-auto py-6 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nikah Register</h1>
                    <p className="text-muted-foreground mt-1">Register and manage nikah records. Certificates are generated from register data.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/nikah-registers/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Register
                </Button>
            </div>

            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Registered Nikahs</CardTitle>
                    <CardDescription>A list of all nikah register entries.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="font-semibold text-lg">No records yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-4">No nikah registrations yet. Click the button above to create one.</p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/nikah-registers/new')}>
                                Create First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Register No.</TableHead>
                                        <TableHead>Groom</TableHead>
                                        <TableHead>Bride</TableHead>
                                        <TableHead>Nikah Date</TableHead>
                                        <TableHead>Place</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell className="font-medium">{r.registerNo}</TableCell>
                                            <TableCell>{r.groomName}</TableCell>
                                            <TableCell>{r.brideName}</TableCell>
                                            <TableCell>{format(new Date(r.nikahDate), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{r.nikahPlace}</TableCell>
                                            <TableCell className="text-right h-full">
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
                </CardContent>
            </Card>
        </div>
    );
}
