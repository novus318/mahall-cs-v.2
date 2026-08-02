'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDeathRegisterById } from '@/lib/api';
import DeathRegisterForm from '@/components/death-registers/DeathRegisterForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditDeathRegisterPage() {
    const params = useParams();
    const router = useRouter();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            getDeathRegisterById(params.id as string)
                .then(data => setRecord(data))
                .catch(err => console.error("Failed to fetch death record", err))
                .finally(() => setLoading(false));
        }
    }, [params.id]);

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)] max-w-5xl w-full">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1 sm:mt-0"><ArrowLeft className="h-5 w-5" /></Button>
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Register · Edit Death
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mt-2">Edit Death Record</h2>
                    <p className="text-muted-foreground text-sm mt-1">Update the details of the death entry.</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : record ? (
                <DeathRegisterForm initialData={record} />
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    Death record not found.
                </div>
            )}
        </div>
    );
}
