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

const underlineInput = "h-auto rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 text-base shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 md:text-base";
const formLabelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";
const selectTriggerClass = "w-full rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 h-auto shadow-none";

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

                <Card className="border-border shadow-sm bg-card">
                    <CardHeader className="border-b bg-muted/40 p-4 !pb-1">
                        <CardTitle className="text-base font-semibold">Deceased Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={formLabelClass}>Full Name</FormLabel>
                                <FormControl><Input className={underlineInput} placeholder="Name of deceased" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={formLabelClass}>Gender</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                        <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select gender" /></SelectTrigger>
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
                                <FormLabel className={formLabelClass}>Mahall ID</FormLabel>
                                <FormControl><Input className={underlineInput} placeholder="e.g. M-00123" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="age" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={formLabelClass}>Age</FormLabel>
                                <FormControl><Input className={underlineInput} type="number" min="0" placeholder="Age at death" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                    <CardContent className='mt-2 pb-3'>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={formLabelClass}>Address</FormLabel>
                                <FormControl><Input className={underlineInput} placeholder="Full address" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card">
                    <CardHeader className="border-b bg-muted/40 p-4 !pb-1">
                        <CardTitle className="text-base font-semibold">Death & Burial</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="dateOfDeath" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={formLabelClass}>Date of Death</FormLabel>
                                    <FormControl><Input className={underlineInput} type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="placeOfDeath" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={formLabelClass}>Place of Death</FormLabel>
                                    <FormControl><Input className={underlineInput} placeholder="Hospital, home, etc." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="causeOfDeath" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={formLabelClass}>Cause of Death</FormLabel>
                                    <FormControl><Input className={underlineInput} placeholder="If known" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dateOfBurial" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={formLabelClass}>Date of Burial</FormLabel>
                                    <FormControl><Input className={underlineInput} type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="zone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={formLabelClass}>Zone/Section of Qabar</FormLabel>
                                    <FormControl><Input className={underlineInput} placeholder="e.g. Zone A, Section 2" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card">
                    <CardHeader className="border-b bg-muted/40 p-4 !pb-1">
                        <CardTitle className="text-base font-semibold">Informer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                        <FormField control={form.control} name="informerName" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={formLabelClass}>Informer Name</FormLabel>
                                <FormControl><Input className={underlineInput} placeholder="Name of person reporting" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="informerPhone" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={formLabelClass}>Informer Phone</FormLabel>
                                <FormControl><Input className={underlineInput} placeholder="Phone number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                        {submitting ? 'Saving...' : initialData ? 'Update Record' : 'Save Record'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
