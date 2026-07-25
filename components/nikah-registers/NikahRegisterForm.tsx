'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createNikahRegister, updateNikahRegister } from '@/lib/api';
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

const nikahRegisterSchema = z.object({
    dateOfRegistration: z.string().optional(),
    groomName: z.string().min(1, 'Required'),
    groomFatherName: z.string().min(1, 'Required'),
    groomAddress: z.string().optional(),
    groomMahallId: z.string().optional(),
    brideName: z.string().min(1, 'Required'),
    brideFatherName: z.string().min(1, 'Required'),
    brideAddress: z.string().optional(),
    brideMahallId: z.string().optional(),
    nikahDate: z.string().min(1, 'Required'),
    nikahTime: z.string().optional(),
    nikahPlace: z.string().min(1, 'Required'),
    mahrAmount: z.string().min(1, 'Required'),
    brideGuardian: z.string().min(1, 'Required'),
    witness1Name: z.string().min(1, 'Required'),
    witness2Name: z.string().min(1, 'Required'),
    qaziName: z.string().min(1, 'Required'),
    remarks: z.string().optional(),
});

type NikahRegisterFormValues = z.infer<typeof nikahRegisterSchema>;

export default function NikahRegisterForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const defaultValues = initialData ? {
        ...initialData,
        dateOfRegistration: initialData.dateOfRegistration ? new Date(initialData.dateOfRegistration).toISOString().split('T')[0] : '',
        nikahDate: initialData.nikahDate ? new Date(initialData.nikahDate).toISOString().split('T')[0] : '',
    } : {
        dateOfRegistration: new Date().toISOString().split('T')[0],
        groomName: '',
        groomFatherName: '',
        groomAddress: '',
        groomMahallId: '',
        brideName: '',
        brideFatherName: '',
        brideAddress: '',
        brideMahallId: '',
        nikahDate: '',
        nikahTime: '',
        nikahPlace: '',
        mahrAmount: '',
        brideGuardian: '',
        witness1Name: '',
        witness2Name: '',
        qaziName: '',
        remarks: '',
    };

    const form = useForm<NikahRegisterFormValues>({
        resolver: zodResolver(nikahRegisterSchema),
        defaultValues,
    });

    const onSubmit = async (data: NikahRegisterFormValues) => {
        setSubmitting(true);
        try {
            if (initialData?._id) {
                await updateNikahRegister(initialData._id, data);
                toast.success('Nikah register updated successfully');
                router.push(`/dashboard/nikah-registers/${initialData._id}`);
                router.refresh();
            } else {
                const result = await createNikahRegister(data);
                if (result?._id) {
                    toast.success('Nikah registered successfully');
                    router.push(`/dashboard/nikah-registers/${result._id}`);
                } else {
                    toast.error('Failed to create nikah register');
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error saving nikah register');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Registration Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField control={form.control} name="dateOfRegistration" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Registration</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="text-sm text-muted-foreground mt-2">Register No. will be auto-generated on save.</div>
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
                                    <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="groomFatherName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Father's Name</FormLabel>
                                    <FormControl><Input placeholder="Father's full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="groomAddress" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="groomMahallId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mahall ID (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g. M-00123" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="brideFatherName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Father's Name</FormLabel>
                                    <FormControl><Input placeholder="Father's full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="brideAddress" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="brideMahallId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mahall ID (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g. M-00123" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Nikah Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="nikahDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Nikah</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="nikahTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time of Nikah (Optional)</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="nikahPlace" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Place of Nikah</FormLabel>
                                    <FormControl><Input placeholder="Venue" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="mahrAmount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mahr Amount</FormLabel>
                                    <FormControl><Input placeholder="e.g. Rs. 50,000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="brideGuardian" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bride Guardian (Wali)</FormLabel>
                                    <FormControl><Input placeholder="Name of Wali" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Witnesses & Officiator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="witness1Name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Witness 1</FormLabel>
                                    <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="witness2Name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Witness 2</FormLabel>
                                    <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="qaziName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qazi / Imam Name</FormLabel>
                                    <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="remarks" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks (Optional)</FormLabel>
                                    <FormControl><Input placeholder="Any additional notes" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : initialData ? 'Update Register' : 'Save Register'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
