'use client'

import React, { useEffect, useState } from 'react';
import { getDeathRegisters } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Plus, ExternalLink, Eye } from 'lucide-react';
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
        <div className="container mx-auto py-6 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Death Register</h1>
                    <p className="text-muted-foreground mt-1">Record and manage death registrations.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/death-registers/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Record
                </Button>
            </div>

            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Registered Deaths</CardTitle>
                    <CardDescription>A list of all recorded death entries.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
                            <Heart className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="font-semibold text-lg">No records yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-4">No death entries have been registered. Click the button above to add one.</p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/death-registers/new')}>
                                Add First Record
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Gender</TableHead>
                                        <TableHead>Mahall ID</TableHead>
                                        <TableHead>Age</TableHead>
                                        <TableHead>Date of Death</TableHead>
                                        <TableHead>Zone</TableHead>
                                        <TableHead>Informer</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record._id}>
                                            <TableCell className="font-medium">{record.name}</TableCell>
                                            <TableCell>{record.gender || '-'}</TableCell>
                                            <TableCell>{record.mahallId || '-'}</TableCell>
                                            <TableCell>{record.age ?? '-'}</TableCell>
                                            <TableCell>{format(new Date(record.dateOfDeath), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{record.zone || '-'}</TableCell>
                                            <TableCell>{record.informerName}</TableCell>
                                            <TableCell className="text-right h-full">
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
                </CardContent>
            </Card>
        </div>
    );
}
