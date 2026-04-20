'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogAction as AlertDialogConfirm, // Alias if needed, but Action is fine
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
    const [isLoading, setIsLoading] = useState(false);
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
        try {
            const { data } = await api.get('/settings/alert-contacts');
            if (data && Array.isArray(data.data)) {
                form.reset({ contacts: data.data });
            }
        } catch (error) {
            toast.error("Failed to load contacts");
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
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
            setIsLoading(false);
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
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">

                {/* ... Header ... */}
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-sm font-medium">Alert Contacts</h3>
                        <p className="text-xs text-muted-foreground">Recipients for critical alerts.</p>
                    </div>
                    <Button onClick={() => append({ name: '', number: '' })} variant="outline" size="sm" className="h-8 text-xs">
                        <Plus className="mr-2 h-3.5 w-3.5" /> Add Contact
                    </Button>
                </div>

                <div className="p-4 sm:p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                            {fields.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center py-8 border rounded-md border-dashed bg-muted/20">
                                    No contacts configured. Add one to receive system alerts.
                                </div>
                            )}

                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-end p-3 rounded-md border bg-muted/10 group hover:bg-muted/20 transition-colors">
                                    <FormField
                                        control={form.control}
                                        name={`contacts.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 space-y-1">
                                                <FormLabel className={index !== 0 ? "sr-only" : "text-xs"}>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Person Name / Role" {...field} className="h-8 text-sm" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`contacts.${index}.number`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 space-y-1">
                                                <FormLabel className={index !== 0 ? "sr-only" : "text-xs"}>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+91..." {...field} className="h-8 text-sm" />
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
                                        className="h-8 w-8 mb-0.5 text-muted-foreground hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={isLoading} size="sm">
                                    <Save className="mr-2 h-4 w-4" />
                                    {isLoading ? "Saving..." : "Save Configuration"}
                                </Button>
                            </div>
                        </form>
                    </Form>
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
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
                <div className="flex gap-2">
                    <div className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22385 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.00003V5.99999Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-300">
                        <p className="font-medium mb-0.5">Note</p>
                        <p className="text-blue-700/80 dark:text-blue-300/80">These contacts will receive SMS/WhatsApp alerts.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
