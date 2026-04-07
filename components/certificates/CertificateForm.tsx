'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCertificate, updateCertificate } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const certificateSchema = z.object({
    certificateNo: z.string().min(1, 'Required'),
    refNo: z.string().min(1, 'Required'),
    groomName: z.string().min(1, 'Required'),
    groomFatherName: z.string().min(1, 'Required'),
    groomMahallId: z.string().optional(),
    brideName: z.string().min(1, 'Required'),
    brideFatherName: z.string().min(1, 'Required'),
    brideMahallId: z.string().optional(),
    nikahDate: z.string().min(1, 'Required'),
    nikahPlace: z.string().min(1, 'Required'),
    mahr: z.string().min(1, 'Required'),
    witness1: z.string().min(1, 'Required'),
    witness2: z.string().min(1, 'Required'),
    qaziName: z.string().min(1, 'Required'),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

export default function CertificateForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const defaultValues = initialData ? {
        ...initialData,
        nikahDate: initialData.nikahDate ? new Date(initialData.nikahDate).toISOString().split('T')[0] : ''
    } : {
        certificateNo: '',
        refNo: '',
        groomName: '',
        groomFatherName: '',
        groomMahallId: '',
        brideName: '',
        brideFatherName: '',
        brideMahallId: '',
        nikahDate: '',
        nikahPlace: '',
        mahr: '',
        witness1: '',
        witness2: '',
        qaziName: '',
    };

    const form = useForm<CertificateFormValues>({
        resolver: zodResolver(certificateSchema),
        defaultValues,
    });

    const onSubmit = async (data: CertificateFormValues) => {
        setSubmitting(true);
        try {
            if (initialData?._id) {
                await updateCertificate(initialData._id, data);
                toast.success('Certificate updated successfully');
                router.push(`/dashboard/certificates/${initialData._id}`);
                router.refresh(); // Refresh to catch updated state
            } else {
                const result = await createCertificate(data);
                if (result?._id) {
                    toast.success('Certificate created successfully');
                    router.push(`/dashboard/certificates/${result._id}`);
                } else {
                    toast.error('Failed to create certificate');
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error saving certificate');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Document Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="certificateNo" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Certificate No.</FormLabel>
                                <FormControl><Input placeholder="e.g. 2024/0051" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="refNo" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ref / JM No.</FormLabel>
                                <FormControl><Input placeholder="e.g. JM/00123" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className='py-3'>
                        <CardHeader>
                            <CardTitle className="text-lg">Groom Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="groomName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Groom Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="groomFatherName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Father's Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="groomMahallId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mahall ID (Optional)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <Card className='py-3'>
                        <CardHeader>
                            <CardTitle className="text-lg">Bride Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="brideName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bride Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="brideFatherName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Father's Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="brideMahallId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mahall ID (Optional)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Nikah & Witness Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="nikahDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Nikah</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="nikahPlace" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Place of Nikah</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="mahr" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mahr</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="witness1" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Witness 1</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="witness2" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Witness 2</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="qaziName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name of Qazi / Imam</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Generating...' : 'Generate Certificate'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
