"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicRentDetails, getPublicRentDues, createRazorpayOrder } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ExternalLink, ArrowLeft, User, Building2, Phone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export default function PayRentPage() {
    const params = useParams();
    const id = params.id as string;

    const [contract, setContract] = useState<any>(null);
    const [dues, setDues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [payingDue, setPayingDue] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getPublicRentDetails(id).then((r: any) => r?.data || r),
            getPublicRentDues(id).then((r: any) => (Array.isArray(r) ? r : r?.data || []))
        ])
            .then(([contractData, duesData]) => {
                setContract(contractData);
                setDues(duesData);
            })
            .catch((err: any) => setError(err?.message || "Failed to load data"))
            .finally(() => setLoading(false));
    }, [id]);

    const openPayDialog = (due: any) => {
        setPayingDue(due);
        setPaymentAmount(due.amount - (due.collectedAmount || 0));
    };

    const handlePay = async () => {
        if (!payingDue || !contract) return;
        setSubmitting(true);
        try {
            const contact = contract.tenant?.phone || "";
            const data = await createRazorpayOrder({
                amount: paymentAmount,
                type: 'rent',
                rentDueId: payingDue._id,
                entityId: "cnt/" + id,
                name: contract.tenant?.name || "Tenant",
                contact,
                receipt_note: `Rent Payment - ${payingDue.monthYear}`
            });

            if (!data.success) {
                throw new Error("Failed to create order");
            }

            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Mahall Management System",
                description: `Rent Payment - ${payingDue.monthYear}`,
                order_id: data.order.id,
                handler: function () {
                    setPayingDue(null);
                    toast.success("Payment successful!");
                },
                prefill: {
                    name: contract.tenant?.name || "Tenant",
                    contact
                },
                notes: {
                    type: 'rent',
                    rentDueId: payingDue._id,
                    entityId: "cnt/" + id,
                    name: contract.tenant?.name || "Tenant",
                    contact
                },
                theme: { color: "#16a34a" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                toast.error(response.error?.description || "Payment failed");
            });
            rzp.open();
        } catch (err: any) {
            toast.error(err?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

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

                {contract && (
                    <Card className="shadow-sm border-border mb-6">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0">
                                    <Building2 className="h-5 w-5 text-chart-3" />
                                </div>
                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <p className="font-semibold text-base truncate">{contract.tenant?.name || 'Tenant'}</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-1">
                                        {contract.tenant?.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                                <span>{contract.tenant.phone}</span>
                                            </div>
                                        )}
                                        {contract.tenant?.shopName && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                <span>{contract.tenant.shopName}</span>
                                            </div>
                                        )}
                                        {contract.tenant?.place && (
                                            <div className="text-xs text-muted-foreground col-span-2">
                                                <span className="text-muted-foreground/60">Address: </span>{contract.tenant.place}
                                            </div>
                                        )}
                                        {contract.rooms && contract.rooms.length > 0 && (
                                            <div className="text-xs text-muted-foreground col-span-2">
                                                <span className="text-muted-foreground/60">Room(s): </span>
                                                {contract.rooms.map((r: any) => r.roomNumber).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-sm border-border">
                    <CardHeader className="pb-4 border-b border-border">
                        <CardTitle className="text-lg font-semibold">Rent Dues</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {dues.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-10">No rent dues found.</div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <TableHead className="h-9 text-xs font-semibold">Period</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold">Status</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Amount</TableHead>
                                        <TableHead className="h-9 text-xs font-semibold text-right">Collected</TableHead>
                                        <TableHead className="h-9 w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dues.map((due: any) => {
                                        const lastTx = due.transactions?.length > 0 ? due.transactions[due.transactions.length - 1] : null;
                                        const receiptId = lastTx?.receipt || null;

                                        return (
                                            <TableRow key={due._id} className="hover:bg-muted/50 border-b last:border-0">
                                                <TableCell className="py-2.5 text-xs font-medium">{due.monthYear}</TableCell>
                                                <TableCell className="py-2.5">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-1.5 py-0 h-5 border-0 font-medium",
                                                        due.status === "PAID"
                                                            ? "bg-chart-1/10 text-chart-1"
                                                            : due.status === "PARTIAL"
                                                                ? "bg-chart-2/10 text-chart-2"
                                                                : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {due.status}
                                                    </Badge>
                                                    {receiptId && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1.5" title="View Receipt"
                                                            onClick={() => window.open(`/api/receipts/${receiptId}/pdf`, "_blank")}>
                                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-right">₹{due.amount}</TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-right text-muted-foreground">
                                                    {due.collectedAmount > 0 ? `₹${due.collectedAmount}` : "-"}
                                                </TableCell>
                                                <TableCell className="py-2.5 text-right">
                                                    {due.status !== "PAID" && (
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
                        <DialogTitle className="text-base">Pay Rent</DialogTitle>
                    </DialogHeader>
                    {payingDue && (
                        <div className="space-y-4 py-2">
                            <div className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">Period:</span> <span className="font-medium">{payingDue.monthYear}</span></p>
                                <p><span className="text-muted-foreground">Total:</span> <span className="font-medium">₹{payingDue.amount}</span></p>
                                {payingDue.collectedAmount > 0 && (
                                    <p><span className="text-muted-foreground">Collected:</span> <span className="font-medium">₹{payingDue.collectedAmount}</span></p>
                                )}
                                <p><span className="text-muted-foreground">Due:</span> <span className="font-semibold text-chart-1">₹{payingDue.amount - (payingDue.collectedAmount || 0)}</span></p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Payment Amount</label>
                                <Input type="number" value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    min={1} max={payingDue.amount - (payingDue.collectedAmount || 0)} />
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
