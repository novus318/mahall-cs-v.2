'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Save, Bell, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const contactSchema = z.object({
    name: z.string().min(1, "Name required"),
    number: z.string().min(1, "Number required"),
});

const formSchema = z.object({
    contacts: z.array(contactSchema),
});

export default function NotificationSettingsTab() {
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contacts: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "contacts",
    });

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setIsFetching(true);
        try {
            const { data } = await api.get('/settings/alert-contacts');
            if (data && Array.isArray(data.data)) {
                form.reset({ contacts: data.data });
            }
        } catch (error) {
            toast.error("Failed to load contacts");
        } finally {
            setIsFetching(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            await api.put('/settings/alert-contacts', { contacts: values.contacts });
            toast.success("Notification contacts updated");

            // If we were in setup mode (adding first contacts), clear the access
            // so that OTP will be required on next visit
            if (sessionStorage.getItem('settingsSetupMode') === 'true') {
                sessionStorage.removeItem('settingsSetupMode');
                sessionStorage.removeItem('settingsAccess');
                toast.info("OTP verification will be required on your next visit");
            }
        } catch (error: any) {
            toast.error("Failed to save contacts");
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = () => {
        if (deleteIndex !== null) {
            remove(deleteIndex);
            setDeleteIndex(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b bg-muted/40 p-4 sm:p-5">
                    <div>
                        <h3 className="text-sm font-semibold">Alert Contacts</h3>
                        <p className="text-xs text-muted-foreground">Recipients for critical alerts.</p>
                    </div>
                    <Button onClick={() => append({ name: '', number: '' })} variant="outline" size="sm" className="h-8 text-xs" disabled={isFetching}>
                        <Plus className="mr-2 h-3.5 w-3.5" /> Add Contact
                    </Button>
                </div>

                <div className="p-4 sm:p-6">
                    {isFetching ? (
                        <div className="space-y-3" aria-busy="true">
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts...
                            </div>
                            {[0, 1].map(i => (
                                <div key={i} className="flex flex-col sm:flex-row gap-3 animate-pulse">
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-16 rounded bg-muted/70" />
                                        <div className="h-9 rounded-md bg-muted/70" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-20 rounded bg-muted/70" />
                                        <div className="h-9 rounded-md bg-muted/70" />
                                    </div>
                                    <div className="h-9 w-9 shrink-0 rounded-md bg-muted/70" />
                                </div>
                            ))}
                            <div className="flex justify-end pt-3">
                                <div className="h-9 w-40 rounded-md bg-muted/70 animate-pulse" />
                            </div>
                        </div>
                    ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                            {fields.length === 0 && (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No contacts configured</p>
                                    <p className="text-xs text-muted-foreground max-w-sm">Add a contact to start receiving SMS/WhatsApp system alerts.</p>
                                </div>
                            )}

                            {fields.map((field, index) => (
                                <div key={field.id} className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-lg border bg-muted/10 group hover:bg-muted/20 transition-colors">
                                    <FormField
                                        control={form.control}
                                        name={`contacts.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 space-y-1.5">
                                                <FormLabel className={index !== 0 ? "sr-only" : "text-xs font-medium"}>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Person Name / Role" {...field} className="h-9 text-sm bg-background" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`contacts.${index}.number`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 space-y-1.5">
                                                <FormLabel className={index !== 0 ? "sr-only" : "text-xs font-medium"}>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91..." {...field} className="h-9 text-sm bg-background" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteIndex(index)}
                                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Remove contact"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="flex justify-end pt-3">
                                <Button type="submit" disabled={isSaving} size="sm">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isSaving ? "Saving..." : "Save Configuration"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the contact from the alert list. This action cannot be undone if you save the changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-start gap-3 rounded-lg border bg-chart-3/10 p-4 border-chart-3/20">
                <div className="shrink-0 mt-0.5 text-chart-3">
                    <Info className="h-4 w-4" />
                </div>
                <div className="text-xs">
                    <p className="font-medium text-foreground mb-0.5">Note</p>
                    <p className="text-muted-foreground">These contacts will receive SMS/WhatsApp alerts.</p>
                </div>
            </div>
        </div>
    );
}
