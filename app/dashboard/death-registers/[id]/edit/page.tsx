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
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Death Record</h1>
                    <p className="text-gray-500">Update the details of the death entry.</p>
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
                <div className="text-center py-12 text-gray-500">
                    Death record not found.
                </div>
            )}
        </div>
    );
}
