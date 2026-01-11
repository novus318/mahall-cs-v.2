import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateSubscription, getDues, generateDue, payDue, getAccounts, initiateRejection, confirmRejection, API_URL } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Coins, History, Calendar as CalendarIcon, Check, Settings2, Plus, CreditCard, Wallet, Landmark, ShieldAlert, LockKeyhole, ExternalLink } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CollectionTabProps {
    type: 'house' | 'member';
    entityId: string;
    entityName: string;
    currentSubscription: {
        frequency: 'Monthly' | 'Yearly' | 'None';
        amount: number;
    } | undefined;
    onUpdate: () => void;
}

export function HouseCollectionTab({ type, entityId, entityName, currentSubscription, onUpdate }: CollectionTabProps) {
    const [loadingDues, setLoadingDues] = useState(true)
    const [dues, setDues] = useState<any[]>([])
    const [generating, setGenerating] = useState(false)

    // Subscription Editing
    const [isEditingSub, setIsEditingSub] = useState(false)
    const [newFrequency, setNewFrequency] = useState<'Monthly' | 'Yearly' | 'None'>(currentSubscription?.frequency || 'None')
    const [newAmount, setNewAmount] = useState(currentSubscription?.amount || 0)
    const [savingSub, setSavingSub] = useState(false)

    // Payment State
    const [payingDue, setPayingDue] = useState<any>(null)
    const [isPayOpen, setIsPayOpen] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [loadingAccounts, setLoadingAccounts] = useState(false)
    const [paying, setPaying] = useState(false)

    // Rejection / OTP State
    const [isOtpOpen, setIsOtpOpen] = useState(false)
    const [otp, setOtp] = useState("")
    const [sendingOtp, setSendingOtp] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)

    // Period Selection State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)

    const fetchDues = async () => {
        setLoadingDues(true)
        try {
            const data = await getDues({ entityId, entityType: type === 'house' ? 'House' : 'Member' })
            setDues(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingDues(false)
        }
    }

    const fetchAccounts = async () => {
        setLoadingAccounts(true)
        try {
            const data = await getAccounts()
            setAccounts(Array.isArray(data) ? data : [])
            // Sets default to Cash or Primary account if available
            if (Array.isArray(data) && data.length > 0) {
                const defaultAcc = data.find((a: any) => a.isPrimary) || data[0]
                setSelectedAccount(defaultAcc._id)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load accounts")
        } finally {
            setLoadingAccounts(false)
        }
    }

    useEffect(() => {
        if (entityId) {
            fetchDues()
            setNewFrequency(currentSubscription?.frequency || 'None')
            setNewAmount(currentSubscription?.amount || 0)
        }
    }, [entityId, currentSubscription])

    useEffect(() => {
        if (isPayOpen) {
            fetchAccounts()
        }
    }, [isPayOpen])

    const handleUpdateSubscription = async () => {
        setSavingSub(true)
        try {
            await updateSubscription(type, entityId, { frequency: newFrequency, amount: Number(newAmount) })
            toast.success("Settings saved")
            setIsEditingSub(false)
            onUpdate()
        } catch (error: any) {
            toast.error(error.message || "Failed to update subscription")
        } finally {
            setSavingSub(false)
        }
    }

    const handleGenerateDue = async () => {
        if (currentSubscription?.frequency === 'None') {
            toast.error("Configure subscription first")
            return
        }

        let period = ""
        if (currentSubscription?.frequency === 'Monthly') {
            period = `${selectedMonth.toString().padStart(2, '0')}-${selectedYear}`
        } else {
            period = `${selectedYear}`
        }

        setGenerating(true)
        try {
            await generateDue({ entityType: type === 'house' ? 'House' : 'Member', entityId, period })
            toast.success(`Generated: ${period}`)
            fetchDues()
            setIsGenerateOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to generate due")
        } finally {
            setGenerating(false)
        }
    }

    const openPayDialog = (due: any) => {
        setPayingDue(due)
        setIsPayOpen(true)
    }

    const handleConfirmPay = async () => {
        if (!payingDue || !selectedAccount) return

        setPaying(true)
        try {
            await payDue({
                dueId: payingDue._id,
                amount: payingDue.amount - payingDue.paidAmount,
                accountId: selectedAccount,
                paymentMethod: 'Cash' // Can be dynamic based on account type if needed
            })
            toast.success("Payment recorded successfully")
            fetchDues()
            setIsPayOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Payment failed")
        } finally {
            setPaying(false)
        }
    }

    // Rejection Flow
    const handleInitiateRejection = async () => {
        if (!payingDue) return;

        setSendingOtp(true)
        try {
            await initiateRejection(payingDue._id)
            toast.success("OTP sent to administrators")
            setIsPayOpen(false) // Close payment dialog
            setIsOtpOpen(true)  // Open OTP dialog
            setOtp("")          // Reset OTP input
        } catch (error: any) {
            toast.error(error.message || "Failed to initiate rejection")
        } finally {
            setSendingOtp(false)
        }
    }

    const handleConfirmRejection = async () => {
        if (!payingDue || otp.length < 6) return;

        setVerifyingOtp(true)
        try {
            await confirmRejection(payingDue._id, otp)
            toast.success("Due rejected successfully")
            setIsOtpOpen(false)
            fetchDues()
        } catch (error: any) {
            toast.error(error.message || "Invalid OTP or failed to reject")
        } finally {
            setVerifyingOtp(false)
        }
    }

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-black/20">
            {/* Header / Stats Strip */}
            <div className="px-6 py-4 border-b bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Frequency</span>
                        {isEditingSub ? (
                            <Select value={newFrequency} onValueChange={(v: any) => setNewFrequency(v)}>
                                <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                    <SelectItem value="Yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{currentSubscription?.frequency || 'None'}</span>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Amount</span>
                        {isEditingSub ? (
                            <Input
                                type="number"
                                className="h-7 w-[80px] text-xs"
                                value={newAmount}
                                onChange={(e) => setNewAmount(Number(e.target.value))}
                            />
                        ) : (
                            <span className="text-sm font-semibold font-mono">
                                {currentSubscription?.amount ? `₹${currentSubscription.amount}` : '-'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditingSub ? (
                        <>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingSub(false)}>Cancel</Button>
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleUpdateSubscription} disabled={savingSub}>
                                {savingSub ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-2" onClick={() => setIsEditingSub(true)}>
                            <Settings2 className="h-3 w-3 text-muted-foreground" /> Configure
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden flex flex-col p-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" /> History
                    </h3>

                    <Popover open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                        <PopoverTrigger asChild>
                            <Button size="sm" className="h-8 text-xs gap-2 shadow-sm" disabled={currentSubscription?.frequency === 'None'}>
                                <Plus className="h-3.5 w-3.5" /> Generate Due
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="end">
                            <div className="p-3 border-b bg-slate-50 dark:bg-neutral-900/50">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Select Period ({currentSubscription?.frequency})
                                </h4>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedYear(y => y - 1)}>&lt;</Button>
                                    <span className="text-sm font-bold">{selectedYear}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedYear(y => y + 1)}>&gt;</Button>
                                </div>

                                {currentSubscription?.frequency === 'Monthly' && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {months.map((m, i) => (
                                            <Button
                                                key={m}
                                                variant={selectedMonth === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                className={cn("h-7 text-xs", selectedMonth === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                                                onClick={() => setSelectedMonth(i + 1)}
                                            >
                                                {m}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                <Button className="w-full h-8 text-xs" onClick={handleGenerateDue} disabled={generating}>
                                    {generating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Confirm Generation
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <Card className="flex-1 border shadow-sm overflow-hidden bg-white dark:bg-neutral-900 rounded-lg">
                    <CardContent className="p-0 h-full overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-neutral-900 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="h-9 text-xs font-semibold">Period</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold">Status</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold">Paid On</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold text-right">Amount</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold text-right">Paid</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold text-right w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingDues ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : dues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                                            No dues found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dues.map((due) => {
                                        // Determine Payment Date (Last transaction date if exists)
                                        const paidDate = due.transactions?.length > 0
                                            ? new Date(due.transactions[due.transactions.length - 1].date).toLocaleDateString('en-GB')
                                            : '-';

                                        return (
                                            <TableRow key={due._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 border-b last:border-0">
                                                <TableCell className="py-2 text-xs font-medium">{due.period}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-1.5 py-0 h-5 border-0 font-medium",
                                                        due.status === 'PAID' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                            due.status === 'PARTIAL' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                                due.status === 'REJECTED' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                    )}>
                                                        {due.status}
                                                    </Badge>

                                                    {/* Receipt Link if Paid/Partial and has transactions */}
                                                    {(due.status === 'PAID' || due.status === 'PARTIAL') && due.transactions?.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 ml-2"
                                                            title="View Receipt"
                                                            onClick={() => {
                                                                const lastTx = due.transactions[due.transactions.length - 1];
                                                                const recId = lastTx.collectionReceipt || lastTx.receiptId;

                                                                if (recId) {
                                                                    window.location.href = `/dashboard/collection-receipts/${recId}`;
                                                                }
                                                            }}
                                                        >
                                                            <ExternalLink className="h-3 w-3 text-slate-500" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 text-[10px] text-muted-foreground font-mono">
                                                    {paidDate}
                                                </TableCell>
                                                <TableCell className="py-2 text-xs font-mono text-right">₹{due.amount}</TableCell>
                                                <TableCell className="py-2 text-xs font-mono text-right text-muted-foreground">
                                                    {due.paidAmount > 0 ? `₹${due.paidAmount}` : '-'}
                                                </TableCell>
                                                <TableCell className="py-2 text-right">
                                                    {due.status !== 'PAID' && due.status !== 'REJECTED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-6 w-12 text-[10px] px-0 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                            onClick={() => openPayDialog(due)}
                                                        >
                                                            Pay
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-green-600" /> Confirm Payment
                        </DialogTitle>
                        <DialogDescription>
                            Receive payment for <strong>{entityName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    {payingDue && (
                        <div className="grid gap-4 py-4">
                            <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg border space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Period:</span>
                                    <span className="font-semibold">{payingDue.period}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount Due:</span>
                                    <span className="font-mono font-bold text-green-600">₹{payingDue.amount - payingDue.paidAmount}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Deposit To Account</Label>
                                {loadingAccounts ? (
                                    <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading accounts...</div>
                                ) : (
                                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc._id} value={acc._id}>
                                                    <div className="flex items-center gap-2">
                                                        {acc.type === 'BANK' ? <Landmark className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                                                        <span>{acc.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex space-x-2 sm:justify-between">
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleInitiateRejection}
                                disabled={sendingOtp}
                            >
                                {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                            </Button>
                            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmPay} disabled={paying || !selectedAccount}>
                                {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Pay
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* OTP Rejection Dialog */}
            <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <ShieldAlert className="h-5 w-5" /> Reject Collection
                        </DialogTitle>
                        <DialogDescription>
                            Enter the OTP sent to administrator WhatsApp to confirm rejection.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>One-Time Password</Label>
                            <div className="relative">
                                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9 font-mono tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                OTP is valid for 10 minutes.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOtpOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmRejection}
                            disabled={verifyingOtp || otp.length < 6}
                        >
                            {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
