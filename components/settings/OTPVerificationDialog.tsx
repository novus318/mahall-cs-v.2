'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface OTPVerificationDialogProps {
    open: boolean;
    onVerified: () => void;
    onClose?: () => void;
}

export default function OTPVerificationDialog({ open, onVerified, onClose }: OTPVerificationDialogProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [otpSent, setOtpSent] = useState(false);
    const [noContactsError, setNoContactsError] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const otpInitiatedRef = useRef(false);

    useEffect(() => {
        if (open && !otpSent && !otpInitiatedRef.current) {
            otpInitiatedRef.current = true;
            handleSendOTP();
        }

        // Reset ref when dialog closes
        if (!open) {
            otpInitiatedRef.current = false;
            setOtpSent(false);
            setNoContactsError(false);
            setOtp(['', '', '', '', '', '']);
        }
    }, [open, otpSent]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleSendOTP = async () => {
        setSending(true);
        setNoContactsError(false);
        try {
            const response = await api.post('/settings/send-otp');
            if (response.data.status) {
                toast.success(response.data.message);
                setOtpSent(true);
                setTimeLeft(response.data.data.expiresIn || 300);
                // Focus first input
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                toast.error(response.data.message || 'Failed to send OTP');
                if (response.data.message?.includes('No alert contacts')) {
                    setNoContactsError(true);
                }
            }
        } catch (error: any) {
            console.error('Send OTP Error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please ensure alert contacts are configured.';
            toast.error(errorMessage);
            if (errorMessage.includes('No alert contacts')) {
                setNoContactsError(true);
            }
        } finally {
            setSending(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Paste handling
            const pastedData = value.slice(0, 6);
            const newOtp = [...otp];
            pastedData.split('').forEach((char, i) => {
                if (index + i < 6 && /^\d$/.test(char)) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);

            // Focus last filled input or next empty
            const nextIndex = Math.min(index + pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter complete 6-digit OTP');
            return;
        }

        setVerifying(true);
        try {
            const response = await api.post('/settings/verify-otp', { otp: otpString });
            if (response.data.status) {
                toast.success('OTP verified successfully');
                // Store verification timestamp in sessionStorage
                sessionStorage.setItem('settingsAccess', Date.now().toString());
                onVerified();
            } else {
                toast.error(response.data.message || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error: any) {
            console.error('Verify OTP Error:', error);
            toast.error(error.response?.data?.message || 'Invalid OTP');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setVerifying(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && onClose) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">Verify Settings Access</DialogTitle>
                    <DialogDescription className="text-center">
                        {sending ? (
                            'Sending OTP to alert contacts...'
                        ) : otpSent ? (
                            <>
                                An OTP has been sent to all configured alert contacts via WhatsApp.
                                <br />
                                Enter the 6-digit code to continue.
                            </>
                        ) : (
                            'Preparing to send OTP...'
                        )}
                    </DialogDescription>
                </DialogHeader>

                {sending ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Sending OTP to alert contacts...</p>
                    </div>
                ) : noContactsError ? (
                    <div className="space-y-6 py-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-100 dark:border-red-900/50">
                            <div className="flex gap-2 text-sm text-red-800 dark:text-red-300">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">No Alert Contacts Configured</p>
                                    <p className="text-xs text-red-700 dark:text-red-400">
                                        You need to configure alert contacts before you can access settings. Please add at least one alert contact.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onClose && onClose()}
                            >
                                Go Back
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => {
                                    // Temporarily grant access to add alert contacts
                                    sessionStorage.setItem('settingsAccess', Date.now().toString());
                                    sessionStorage.setItem('settingsSetupMode', 'true');
                                    onVerified();
                                }}
                            >
                                Continue to Settings
                            </Button>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
                            <div className="flex gap-2 text-xs text-blue-800 dark:text-blue-300">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>
                                    Click "Continue to Settings" to add alert contacts. Alert contacts are WhatsApp numbers that will receive OTP codes for security verification. After adding contacts, you'll need OTP verification for future access.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : otpSent ? (
                    <div className="space-y-6 py-4">
                        {/* OTP Input */}
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-semibold"
                                    disabled={verifying}
                                />
                            ))}
                        </div>

                        {/* Timer & Resend */}
                        <div className="flex items-center justify-between text-sm">
                            {timeLeft > 0 ? (
                                <p className="text-muted-foreground">
                                    Time remaining: <span className="font-medium text-foreground">{formatTime(timeLeft)}</span>
                                </p>
                            ) : (
                                <p className="text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    OTP expired
                                </p>
                            )}
                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleSendOTP}
                                disabled={sending || timeLeft > 240} // Can resend after 1 minute
                                className="h-auto p-0"
                            >
                                Resend OTP
                            </Button>
                        </div>

                        {/* Verify Button */}
                        <Button
                            className="w-full"
                            onClick={handleVerify}
                            disabled={verifying || otp.some(d => !d) || timeLeft === 0}
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Continue'
                            )}
                        </Button>

                        {/* Info */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
                            <div className="flex gap-2 text-xs text-blue-800 dark:text-blue-300">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>
                                    For security, OTP has been sent to all configured alert contacts. Check your WhatsApp.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
