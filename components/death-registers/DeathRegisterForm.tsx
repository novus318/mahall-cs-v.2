'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createDeathRegister, updateDeathRegister } from '@/lib/api';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const deathRegisterSchema = z.object({
    name: z.string().min(1, 'Required'),
    gender: z.string().optional(),
    mahallId: z.string().optional(),
    age: z.string().optional(),
    address: z.string().optional(),
    dateOfDeath: z.string().min(1, 'Required'),
    placeOfDeath: z.string().optional(),
    causeOfDeath: z.string().optional(),
    dateOfBurial: z.string().optional(),
    zone: z.string().optional(),
    informerName: z.string().min(1, 'Required'),
    informerPhone: z.string().optional(),
});

type DeathRegisterFormValues = z.infer<typeof deathRegisterSchema>;

export default function DeathRegisterForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const defaultValues = initialData ? {
        ...initialData,
        age: initialData.age != null ? String(initialData.age) : '',
        dateOfDeath: initialData.dateOfDeath ? new Date(initialData.dateOfDeath).toISOString().split('T')[0] : '',
        dateOfBurial: initialData.dateOfBurial ? new Date(initialData.dateOfBurial).toISOString().split('T')[0] : '',
    } : {
        name: '',
        gender: '',
        mahallId: '',
        age: '',
        address: '',
        dateOfDeath: '',
        placeOfDeath: '',
        causeOfDeath: '',
        dateOfBurial: '',
        zone: '',
        informerName: '',
        informerPhone: '',
    };

    const form = useForm<DeathRegisterFormValues>({
        resolver: zodResolver(deathRegisterSchema),
        defaultValues,
    });

    const onSubmit = async (data: DeathRegisterFormValues) => {
        setSubmitting(true);
        const payload = { ...data, age: data.age ? Number(data.age) : undefined };
        try {
            if (initialData?._id) {
                await updateDeathRegister(initialData._id, payload);
                toast.success('Death record updated successfully');
                router.push(`/dashboard/death-registers/${initialData._id}`);
                router.refresh();
            } else {
                const result = await createDeathRegister(payload);
                if (result?._id) {
                    toast.success('Death record created successfully');
                    router.push(`/dashboard/death-registers/${result._id}`);
                } else {
                    toast.error('Failed to create death record');
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error saving death record');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Deceased Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="Name of deceased" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="mahallId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mahall ID</FormLabel>
                                <FormControl><Input placeholder="e.g. M-00123" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="age" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="Age at death" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="zone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone</FormLabel>
                                <FormControl><Input placeholder="e.g. North, South, etc." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                    <CardContent className='mt-2'>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Death & Burial</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="dateOfDeath" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Death</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="placeOfDeath" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Place of Death</FormLabel>
                                    <FormControl><Input placeholder="Hospital, home, etc." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="causeOfDeath" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cause of Death</FormLabel>
                                    <FormControl><Input placeholder="If known" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dateOfBurial" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Burial</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className='py-3'>
                    <CardHeader>
                        <CardTitle className="text-lg">Informer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="informerName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Informer Name</FormLabel>
                                <FormControl><Input placeholder="Name of person reporting" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="informerPhone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Informer Phone</FormLabel>
                                <FormControl><Input placeholder="Phone number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : initialData ? 'Update Record' : 'Save Record'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
