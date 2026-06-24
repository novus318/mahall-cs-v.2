"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicEntityDues, getPublicEntityDetails, API_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, ArrowLeft, Home, User, Building2, Phone, MapPin, Droplets, Briefcase, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PayDuesPage() {
    const params = useParams();
    const type = params.type as string;
    const id = params.id as string;

    const [entity, setEntity] = useState<any>(null);
    const [dues, setDues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        Promise.all([
            getPublicEntityDetails(type, id).then((r: any) => r?.data || r),
            getPublicEntityDues(type, id).then((r: any) => (Array.isArray(r) ? r : r?.data || []))
        ])
            .then(([entityData, duesData]) => {
                setEntity(entityData);
                setDues(duesData);
            })
            .catch((err: any) => setError(err?.message || "Failed to load data"))
            .finally(() => setLoading(false));
    }, [type, id]);

    const isHouse = type === "hou";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-neutral-950 dark:to-neutral-900">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white dark:from-neutral-950 dark:to-neutral-900">
                <p className="text-sm text-red-500">{error}</p>
                <Link href="/" className="text-xs text-muted-foreground underline">Go home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-neutral-950 dark:to-neutral-900">
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>
                </div>

                {entity && (
                    <Card className="shadow-sm border-slate-200 dark:border-neutral-800 mb-6">
                        <CardContent className="p-5">
                            {isHouse ? (
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <p className="font-semibold text-base truncate">{entity.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            House ID: {entity.customId}
                                        </p>
                                        {entity.head && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <User className="h-3.5 w-3.5" />
                                                <span>Head: {entity.head.name}</span>
                                            </div>
                                        )}
                                        {entity.family && (
                                            <p className="text-xs text-muted-foreground">
                                                Family: {entity.family.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="space-y-2 min-w-0 flex-1">
                                        <p className="font-semibold text-base truncate">{entity.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Member ID: {entity.customId}
                                        </p>

                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                                            {entity.dateOfBirth && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Cake className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{new Date(entity.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({new Date().getFullYear() - new Date(entity.dateOfBirth).getFullYear()} years)</span>
                                                </div>
                                            )}
                                            {entity.gender && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{entity.gender}</span>
                                                </div>
                                            )}
                                            {entity.occupation && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{entity.occupation}</span>
                                                </div>
                                            )}
                                            {entity.bloodGroup && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Droplets className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{entity.bloodGroup}</span>
                                                </div>
                                            )}
                                        </div>

                                        {entity.house && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                <span>House: {entity.house.name} ({entity.house.customId})</span>
                                            </div>
                                        )}

                                        <div className="border-t border-slate-100 dark:border-neutral-800 pt-2 mt-1">
                                            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Contact & Location</p>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                                    <span>Mobile: {entity.mobile}</span>
                                                </div>
                                                {entity.whatsapp && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="h-3.5 w-3.5 shrink-0" />
                                                        <span>WhatsApp: {entity.whatsapp}</span>
                                                    </div>
                                                )}
                                                {entity.place && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                        <span>{entity.place}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-sm border-slate-200 dark:border-neutral-800 py-3">
                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-semibold">
                            Collection Dues
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {dues.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-10">
                                No dues found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-neutral-900">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <TableHead className="h-9 text-xs font-semibold">Period</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold">Status</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Amount</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Paid</TableHead>
                                        <TableHead className="h-9 w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dues.map((due: any) => {
                                        const receiptId =
                                            due.transactions?.length > 0
                                                ? due.transactions[due.transactions.length - 1]?.collectionReceipt ||
                                                  (typeof due.transactions[due.transactions.length - 1]?.receiptId === "object"
                                                      ? due.transactions[due.transactions.length - 1]?.receiptId?._id
                                                      : due.transactions[due.transactions.length - 1]?.receiptId)
                                                : null;

                                        return (
                                            <TableRow key={due._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 border-b last:border-0">
                                                <TableCell className="py-2.5 text-xs font-medium">{due.period}</TableCell>
                                                <TableCell className="py-2.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] px-1.5 py-0 h-5 border-0 font-medium",
                                                            due.status === "PAID"
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : due.status === "PARTIAL"
                                                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                  : due.status === "REJECTED"
                                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                        )}
                                                    >
                                                        {due.status}
                                                    </Badge>
                                                    {receiptId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 ml-1.5"
                                                            title="View Receipt"
                                                            onClick={() => window.open(`${API_URL}/collections/receipts/${receiptId}/pdf`, "_blank")}
                                                        >
                                                            <ExternalLink className="h-3 w-3 text-slate-500" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-right">₹{due.amount}</TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-right text-muted-foreground">
                                                    {due.paidAmount > 0 ? `₹${due.paidAmount}` : "-"}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-right">
                                                    {due.status !== "PAID" && due.status !== "REJECTED" && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-6 w-12 text-[10px] px-0 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                        >
                                                            Pay
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
