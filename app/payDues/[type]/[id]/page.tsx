"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicEntityDues, getPublicEntityDetails, createRazorpayOrder, API_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ExternalLink, ArrowLeft, Home, User, Building2, Phone, MapPin, Droplets, Briefcase, Cake, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export default function PayDuesPage() {
    const params = useParams();
    const type = params.type as string;
    const id = params.id as string;

    const [entity, setEntity] = useState<any>(null);
    const [dues, setDues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [payingDue, setPayingDue] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [processingDues, setProcessingDues] = useState<string[]>([]);

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

    const pollDueStatus = async (dueId: string) => {
        const maxAttempts = 10;
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const data = await getPublicEntityDues(type, id);
            const duesData: any[] = Array.isArray(data) ? data : data?.data || [];
            setDues(duesData);
            const updated = duesData.find((d: any) => d._id === dueId);
            if (updated && (updated.status === "PAID" || updated.status === "PARTIAL" || updated.status === "REJECTED")) {
                setProcessingDues(prev => prev.filter(id => id !== dueId));
                toast.success("Payment confirmed!");
                return;
            }
        }
        setProcessingDues(prev => prev.filter(id => id !== dueId));
        toast.info("Payment received! It may take a moment to reflect.");
    };

    const openPayDialog = (due: any) => {
        setProcessingDues(prev => prev.filter(id => id !== due._id));
        setPayingDue(due);
        setPaymentAmount(due.amount - (due.paidAmount || 0));
    };

    const handlePay = async () => {
        if (!payingDue || !entity) return;
        const dueId = payingDue._id;
        setProcessingDues(prev => [...prev, dueId]);
        setSubmitting(true);
        try {
            const contact = type === "hou"
                ? (entity.head?.whatsapp || entity.head?.mobile || "")
                : (entity.whatsapp || entity.mobile || "");
            const data = await createRazorpayOrder({
                amount: paymentAmount,
                dueId,
                entityId: (type === "hou" ? "hou/" : "mem/") + id,
                name: entity.name,
                contact,
                receipt_note: `Due Payment - ${payingDue.period}`
            });

            if (!data.success) {
                throw new Error("Failed to create order");
            }

            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Mahall Management System",
                description: `Due Payment - ${payingDue.period}`,
                order_id: data.order.id,
                handler: function () {
                    setPayingDue(null);
                    toast.success("Payment initiated! Verifying...");
                    pollDueStatus(dueId);
                },
                prefill: {
                    name: entity.name,
                    contact
                },
                notes: {
                    dueId,
                    entityId: (type === "hou" ? "hou/" : "mem/") + id,
                    entityCustomId: entity.customId,
                    name: entity.name,
                    contact
                },
                theme: { color: "#16a34a" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                setProcessingDues(prev => prev.filter(id => id !== dueId));
                toast.error(response.error?.description || "Payment failed");
            });
            rzp.open();
        } catch (err: any) {
            setProcessingDues(prev => prev.filter(id => id !== dueId));
            toast.error(err?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const isHouse = type === "hou";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted to-background">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted to-background">
                <p className="text-sm text-destructive">{error}</p>
                <Link href="/" className="text-xs text-muted-foreground underline">Go home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted to-background">
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>
                </div>

                {entity && (
                    <Card className="shadow-sm border-border mb-6">
                        <CardContent className="p-5">
                            {isHouse ? (
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0">
                                        <Home className="h-5 w-5 text-chart-3" />
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                        <p className="font-semibold text-base truncate">{entity.name}</p>
                                        <p className="text-xs text-muted-foreground">House ID: {entity.customId}</p>
                                        {entity.head && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <User className="h-3.5 w-3.5" />
                                                <span>Head: {entity.head.name}</span>
                                            </div>
                                        )}
                                        {entity.family && (
                                            <p className="text-xs text-muted-foreground">Family: {entity.family.name}</p>
                                        )}
                                        {entity.address && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>{entity.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-chart-1/10 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-chart-1" />
                                    </div>
                                    <div className="space-y-2 min-w-0 flex-1">
                                        <p className="font-semibold text-base truncate">{entity.name}</p>
                                        <p className="text-xs text-muted-foreground">Member ID: {entity.customId}</p>

                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                                            {entity.dateOfBirth && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Cake className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{new Date(entity.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ({new Date().getFullYear() - new Date(entity.dateOfBirth).getFullYear()} years)</span>
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

                                        <div className="border-t border-border pt-2 mt-1">
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

                <Card className="shadow-sm border-border">
                    <CardHeader className="pb-4 border-b border-border">
                        <CardTitle className="text-lg font-semibold">Collection Dues</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {dues.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-10">No dues found.</div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/40">
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
                                            <TableRow key={due._id} className="hover:bg-muted/50 border-b last:border-0">
                                                <TableCell className="py-2.5 text-xs font-medium">{due.period}</TableCell>
                                                <TableCell className="py-2.5">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-1.5 py-0 h-5 border-0 font-medium",
                                                        due.status === "PAID"
                                                            ? "bg-chart-1/10 text-chart-1"
                                                            : due.status === "PARTIAL"
                                                                ? "bg-chart-2/10 text-chart-2"
                                                                : due.status === "REJECTED"
                                                                    ? "bg-destructive/10 text-destructive"
                                                                    : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {due.status}
                                                    </Badge>
                                                    {receiptId && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1.5" title="View Receipt"
                                                            onClick={() => window.open(`https://api.tmj.org.in/collections/receipts/${receiptId}/pdf`, "_blank")}>
                                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-right">₹{due.amount}</TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-right text-muted-foreground">
                                                    {due.paidAmount > 0 ? `₹${due.paidAmount}` : "-"}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-right">
                                                    {processingDues.includes(due._id) ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-chart-2 font-medium whitespace-nowrap">
                                                            <Loader2 className="h-3 w-3 animate-spin" /> Verifying
                                                        </span>
                                                    ) : due.status !== "PAID" && due.status !== "REJECTED" && (
                                                        <Button size="sm" variant="secondary"
                                                            className="h-7 text-[10px] px-2 bg-chart-3/10 text-chart-3 hover:bg-chart-3/20"
                                                            onClick={() => openPayDialog(due)}>
                                                            <CreditCard className="h-3 w-3 mr-1" /> Pay
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

            <Dialog open={!!payingDue} onOpenChange={(open) => !open && setPayingDue(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base">Pay Due</DialogTitle>
                    </DialogHeader>
                    {payingDue && (
                        <div className="space-y-4 py-2">
                            <div className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">Period:</span> <span className="font-medium">{payingDue.period}</span></p>
                                <p><span className="text-muted-foreground">Total:</span> <span className="font-medium">₹{payingDue.amount}</span></p>
                                {payingDue.paidAmount > 0 && (
                                    <p><span className="text-muted-foreground">Paid:</span> <span className="font-medium">₹{payingDue.paidAmount}</span></p>
                                )}
                                <p><span className="text-muted-foreground">Due:</span> <span className="font-semibold text-chart-1">₹{payingDue.amount - (payingDue.paidAmount || 0)}</span></p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Payment Amount</label>
                                <Input type="number" value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    min={1} max={payingDue.amount - (payingDue.paidAmount || 0)} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setPayingDue(null)}>Cancel</Button>
                        <Button size="sm" onClick={handlePay} disabled={submitting || paymentAmount <= 0}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Pay ₹{paymentAmount}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
