"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "sonner";
import api from "@/lib/axios";

declare global {
    interface Window {
        Razorpay: any;
    }
}

gsap.registerPlugin(ScrollTrigger);

const donationAmounts = [100, 500, 1000, 2000, 5000];

export default function Donation() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
    const [customAmount, setCustomAmount] = useState("");
    const [donorName, setDonorName] = useState("");
    const [donorPhone, setDonorPhone] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".donation-title",
                { scale: 0.8, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 70%",
                        toggleActions: "play none none reverse",
                    },
                }
            );

            gsap.fromTo(
                ".donation-content",
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 60%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount("");
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

        setIsSubmitting(true);

        try {
            // 1. Create Order
            const { data } = await api.post('/payment-gateway/create-order', {
                amount: amount,
                currency: "INR",
                receipt_note: `Donation from ${donorName}`,
                name: donorName,
                contact: donorPhone
            });

            if (!data.success) {
                throw new Error("Failed to create order");
            }

            const options = {
                key: data.key, // Key from backend
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Mahall Management System", // Or Organization Name
                description: "Donation",
                image: "/logo.png", // Ensure logo exists or remove
                order_id: data.order.id,
                handler: function (response: any) {
                    // Payment Success
                    // Webhook handles backend record creation
                    // We just show success info
                    // console.log(response.razorpay_payment_id);
                    // console.log(response.razorpay_order_id);
                    // console.log(response.razorpay_signature);

                    setIsSubmitting(false);
                    setShowDialog(true);
                    setDonorName("");
                    setDonorPhone("");
                    setSelectedAmount(1000);
                    setCustomAmount("");
                    toast.success("Payment Successful!");
                },
                prefill: {
                    name: donorName,
                    email: "", // Can collect email if needed
                    contact: donorPhone
                },
                notes: {
                    donor_name: donorName,
                    donor_phone: donorPhone,
                    category: "Donation",
                    description: `Donation of ₹${amount}`
                },
                theme: {
                    color: "#16a34a" // Primary Green
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast.error(response.error.description || "Payment Failed");
                setIsSubmitting(false);
            });
            rzp1.open();

        } catch (error: any) {
            console.error("Payment Error:", error);
            toast.error("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    const finalAmount = selectedAmount || parseInt(customAmount) || 0;

    return (
        <section
            id="donation"
            ref={sectionRef}
            className="relative py-20 md:py-32 overflow-hidden bg-background"
        >
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />

                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                        }}
                    />
                ))}

                <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                    <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="currentColor" strokeWidth="1" />
                    <line x1="70%" y1="30%" x2="90%" y2="50%" stroke="currentColor" strokeWidth="1" />
                    <line x1="20%" y1="70%" x2="50%" y2="80%" stroke="currentColor" strokeWidth="1" />
                    <line x1="60%" y1="60%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="1" />
                </svg>
            </div>

            <div className="absolute inset-0 pattern-dots opacity-10" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="donation-title text-muted-foreground font-amiri text-lg tracking-wider mb-2">
                            MAKE A DIFFERENCE
                        </p>
                        <h2 className="donation-title text-3xl md:text-4xl lg:text-5xl font-amiri font-bold text-foreground mb-4">
                            Support Our <span className="text-muted-foreground">Cause</span>
                        </h2>
                        <p className="donation-content text-muted-foreground max-w-2xl mx-auto">
                            Your generous donations help us maintain our services, support the needy,
                            and expand our community programs. Every contribution makes a meaningful impact.
                        </p>
                    </div>

                    <div className="donation-content bg-card/50 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-border">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <Label className="text-foreground/80 mb-4 block">Select Donation Amount (₹)</Label>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                                    {donationAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => handleAmountSelect(amount)}
                                            className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${selectedAmount === amount
                                                ? "bg-primary text-primary-foreground shadow-soft"
                                                : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                                                }`}
                                        >
                                            ₹{amount}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="Enter custom amount"
                                        value={customAmount}
                                        onChange={handleCustomAmountChange}
                                        className="pl-8 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="donorName" className="text-foreground/80 mb-2 block">
                                        Your Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="donorName"
                                        type="text"
                                        required
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="donorPhone" className="text-foreground/80 mb-2 block">
                                        Phone Number <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="donorPhone"
                                        type="tel"
                                        required
                                        value={donorPhone}
                                        onChange={(e) => setDonorPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {finalAmount > 0 && (
                                <div className="bg-muted rounded-lg p-4 border border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-foreground/80">Donation Amount:</span>
                                        <span className="text-2xl font-amiri font-bold text-foreground">₹{finalAmount}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={finalAmount <= 0 || isSubmitting}
                                className="w-full bg-primary text-primary-foreground font-bold py-6 text-lg hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Heart className="w-5 h-5" />
                                        Donate Now
                                    </span>
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground text-sm">
                            For donation inquiries, contact us at{" "}
                            <a href="tel:+918129059992" className="text-primary hover:underline">
                                +91 81290 59992
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="bg-card border-border text-card-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                                <Check className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-2xl font-amiri">JazakAllah Khair!</span>
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            Thank you for your generous donation. Your contribution will help us
                            continue serving our community. May Allah bless you abundantly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 text-center">
                        <Button
                            onClick={() => setShowDialog(false)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
