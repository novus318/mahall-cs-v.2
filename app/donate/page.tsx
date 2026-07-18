"use client";

import { useState } from "react";
import { Heart, Check, ArrowLeft, Sparkles, Phone, User, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { createDonationOrder } from "@/lib/api";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const donationAmounts = [100, 500, 1000, 2000];

export default function DonatePage() {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
    const [customAmount, setCustomAmount] = useState("");
    const [donorName, setDonorName] = useState("");
    const [donorPhone, setDonorPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [paymentId, setPaymentId] = useState("");

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount(String(amount));
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAmount(e.target.value);
        setSelectedAmount(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = selectedAmount || parseInt(customAmount) || 0;
        if (amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (!donorName.trim()) {
            toast.error("Please enter your name");
            return;
        }
        if (!donorPhone.trim()) {
            toast.error("Please enter your phone number");
            return;
        }

        setIsSubmitting(true);

        try {
            const data = await createDonationOrder({
                amount,
                name: donorName,
                contact: donorPhone,
            });

            if (!data.success) {
                throw new Error("Failed to create order");
            }

            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Mahall Management System",
                description: "Donation",
                order_id: data.order.id,
                handler: function (response: any) {
                    setPaymentId(response.razorpay_payment_id);
                    setIsSubmitting(false);
                    setShowSuccess(true);
                    setDonorName("");
                    setDonorPhone("");
                    setSelectedAmount(1000);
                    setCustomAmount("");
                },
                prefill: {
                    name: donorName,
                    contact: donorPhone,
                },
                notes: {
                    donor_name: donorName,
                    donor_phone: donorPhone,
                    category: "DONATIONS",
                    description: `Donation of ₹${amount}`,
                },
                theme: {
                    color: "#16a34a",
                },
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on("payment.failed", function (response: any) {
                toast.error(response.error?.description || "Payment Failed");
                setIsSubmitting(false);
            });
            rzp1.on("modal.close", function () {
                setIsSubmitting(false);
            });
            rzp1.open();
        } catch (error: any) {
            console.error("Payment Error:", error);
            toast.error(error?.message || "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    const finalAmount = selectedAmount || parseInt(customAmount) || 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-neutral-950 dark:to-neutral-900">
            <div className="max-w-lg mx-auto px-4 py-10">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>
                </div>

                <Card className="shadow-sm border-slate-200 dark:border-neutral-800 py-3">
                    <CardHeader className="text-center pb-6 border-b border-slate-100 dark:border-neutral-800">
                        <CardTitle className="text-2xl font-amiri font-bold">Make a Donation</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Your generous contribution helps our community grow and thrive.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label className="text-foreground/80 mb-3 block text-sm font-medium">
                                    Select Amount
                                </Label>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {donationAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => handleAmountSelect(amount)}
                                            className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                                selectedAmount === amount
                                                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-2"
                                                    : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                                            }`}
                                        >
                                            ₹{amount}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <IndianRupee className="h-4 w-4" />
                                    </span>
                                    <Input
                                        type="number"
                                        placeholder="Custom amount"
                                        value={customAmount}
                                        onChange={handleCustomAmountChange}
                                        className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="donorName" className="text-foreground/80 mb-1.5 block text-sm font-medium">
                                        Your Name <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="donorName"
                                            type="text"
                                            required
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="donorPhone" className="text-foreground/80 mb-1.5 block text-sm font-medium">
                                        Phone Number <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="donorPhone"
                                            type="tel"
                                            required
                                            value={donorPhone}
                                            onChange={(e) => setDonorPhone(e.target.value)}
                                            placeholder="Enter your phone number"
                                            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {finalAmount > 0 && (
                                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground/70">Donation Amount:</span>
                                        <span className="text-xl font-bold text-foreground">₹{finalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={finalAmount <= 0 || isSubmitting || !donorName.trim() || !donorPhone.trim()}
                                className="w-full bg-primary text-primary-foreground font-bold py-6 text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Heart className="w-5 h-5" />
                                        Donate ₹{finalAmount || 0}
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    For donation inquiries, contact us at{" "}
                    <a href="tel:+918129059992" className="text-primary hover:underline font-medium">
                        +91 81290 59992
                    </a>
                </p>
            </div>

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-sm bg-card border-border text-card-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <Check className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-2xl font-amiri">JazakAllah Khair!</span>
                        </DialogTitle>
                        <DialogDesc className="text-center text-muted-foreground">
                            <span>Thank you for your generous donation. Your contribution will help us continue serving our community.</span>
                            {paymentId && (
                                <span className="block text-xs text-muted-foreground/70 font-mono mt-2">
                                    Payment ID: {paymentId}
                                </span>
                            )}
                        </DialogDesc>
                    </DialogHeader>
                    <div className="mt-2 text-center">
                        <Button
                            onClick={() => setShowSuccess(false)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
