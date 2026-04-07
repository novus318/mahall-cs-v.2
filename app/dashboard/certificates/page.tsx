'use client'

import React, { useEffect, useState } from 'react';
import { getCertificates } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Plus, ExternalLink, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const data = await getCertificates();
                setCertificates(data || []);
            } catch (error) {
                console.error("Failed to fetch certificates", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nikah Certificates</h1>
                    <p className="text-muted-foreground mt-1">Manage and generate official marriage certificates.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/certificates/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Certificate
                </Button>
            </div>

            <Card className='py-3'>
                <CardHeader>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>A list of all generated Nikah certificates.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : certificates.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
                            <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="font-semibold text-lg">No certificates yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-4">You haven't generated any Nikah certificates. Click the button above to create one.</p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/certificates/new')}>
                                Create First Certificate
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cert No.</TableHead>
                                        <TableHead>Ref No.</TableHead>
                                        <TableHead>Groom</TableHead>
                                        <TableHead>Bride</TableHead>
                                        <TableHead>Nikah Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {certificates.map((cert) => (
                                        <TableRow key={cert._id}>
                                            <TableCell className="font-medium">{cert.certificateNo}</TableCell>
                                            <TableCell>{cert.refNo}</TableCell>
                                            <TableCell>{cert.groomName}</TableCell>
                                            <TableCell>{cert.brideName}</TableCell>
                                            <TableCell>{format(new Date(cert.nikahDate), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right h-full">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/certificates/${cert._id}`)}>
                                                        <Printer className="h-4 w-4 mr-2" />
                                                        Print View
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
