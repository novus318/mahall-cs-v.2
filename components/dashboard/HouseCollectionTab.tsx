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
import Link from "next/link"
import { Fragment } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CollectionTabProps {
    type: 'house' | 'member';
    entityId: string;
    entityName: string;
    currentSubscription: {
        frequency: 'Monthly' | 'Yearly' | 'None';
        amount: number;
    } | undefined;
    onUpdate: () => void;
    entityStatus?: string; // Optional status prop
}

export function HouseCollectionTab({ type, entityId, entityName, currentSubscription, onUpdate, entityStatus }: CollectionTabProps) {
    const [loadingDues, setLoadingDues] = useState(true)
    const [dues, setDues] = useState<any[]>([])

    const [generating, setGenerating] = useState(false)
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    // Subscription Editing
    const [isEditingSub, setIsEditingSub] = useState(false)
    const [newFrequency, setNewFrequency] = useState<'Monthly' | 'Yearly' | 'None'>(currentSubscription?.frequency || 'None')
    const [newAmount, setNewAmount] = useState(currentSubscription?.amount || 0)
    const [savingSub, setSavingSub] = useState(false)

    // Payment State
    const [payingDue, setPayingDue] = useState<any>(null)
    const [isPayOpen, setIsPayOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState<number>(0)
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

    // Check if disabled
    const isDisabled = entityStatus === 'Moved Out';

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
        setPaymentAmount(due.amount - due.paidAmount)
        setIsPayOpen(true)
    }

    const handleConfirmPay = async () => {
        if (!payingDue || !selectedAccount) return

        setPaying(true)
        try {
            await payDue({
                dueId: payingDue._id,
                amount: Number(paymentAmount),
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
        <div className="flex flex-col h-full">
            {/* Header / Stats Strip */}
            <div className="flex items-center justify-between border-b bg-card px-6 py-4 shrink-0">
                <div className="flex items-center gap-6">
                    {/* ... (Frequency/Amount display logic) ... */}
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
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-2"
                            onClick={() => setIsEditingSub(true)}
                            disabled={isDisabled}
                        >
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
                            <Button
                                size="sm"
                                className="h-8 text-xs gap-2 shadow-sm"
                                disabled={currentSubscription?.frequency === 'None' || isDisabled}
                            >
                                <Plus className="h-3.5 w-3.5" /> Generate Due
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="end">
                            <div className="p-3 border-b bg-muted/40">
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

                <Card className="flex-1 overflow-hidden rounded-lg border shadow-sm bg-card">
                    <CardContent className="p-0 h-full overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                <TableRow className="border-b hover:bg-transparent">
                                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider">Period</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider">Paid On</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold text-right uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="h-9 text-xs font-semibold text-right uppercase tracking-wider">Paid</TableHead>
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

                                        const isYearly = due.frequency === 'Yearly' || due.status === 'PARTIAL';
                                        const isExpanded = expandedRowId === due._id;

                                        return (
                                            <Fragment key={due._id}>
                                                <TableRow className={cn("border-b last:border-0 hover:bg-muted/50", isExpanded && "bg-muted/40")}>
                                                    <TableCell className="py-2 text-xs font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {isYearly && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 p-0 text-muted-foreground"
                                                                    onClick={() => setExpandedRowId(isExpanded ? null : due._id)}
                                                                >
                                                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                                </Button>
                                                            )}
                                                            {due.period}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px] px-1.5 py-0 h-5 border-0 font-medium",
                                                            due.status === 'PAID' ? "bg-chart-1/10 text-chart-1" :
                                                                due.status === 'PARTIAL' ? "bg-chart-2/10 text-chart-2" :
                                                                    due.status === 'REJECTED' ? "bg-destructive/10 text-destructive" :
                                                                        "bg-muted/60 text-muted-foreground"
                                                        )}>
                                                            {due.status}
                                                        </Badge>

                                                        {/* Receipt Link if Paid/Partial and has transactions */}
                                                        {(due.status === 'PAID' || due.status === 'PARTIAL') && due.transactions?.length > 0 && !isYearly && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 ml-2"
                                                                title="View Receipt"
                                                                onClick={() => {
                                                                    const lastTx = due.transactions[due.transactions.length - 1];
                                                                    const recId = lastTx?.collectionReceipt || (typeof lastTx?.receiptId === 'object' ? lastTx.receiptId?._id : lastTx?.receiptId);

                                                                    if (recId) {
                                                                        window.open(`http://localhost:5000/api/collections/receipts/${recId}/pdf`, '_blank');
                                                                    }
                                                                }}
                                                            >
                                                                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
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
                                                                className="h-6 w-12 text-[10px] px-0 bg-primary text-primary-foreground hover:bg-primary/90"
                                                                onClick={() => openPayDialog(due)}
                                                            >
                                                                Pay
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="p-0 border-b bg-muted/40">
                                                            <div className="p-3 pl-8">
                                                                <Table>
                                                                    <TableHeader className="bg-transparent border-b">
                                                                        <TableRow className="h-8 hover:bg-transparent">
                                                                            <TableHead className="h-8 text-[10px] font-semibold">Date</TableHead>
                                                                            <TableHead className="h-8 text-[10px] font-semibold">Receipt No</TableHead>
                                                                            <TableHead className="h-8 text-[10px] font-semibold text-right">Amount</TableHead>
                                                                            <TableHead className="h-8 text-[10px] font-semibold text-right">Deposit Account</TableHead>
                                                                            <TableHead className="h-8 text-right w-[50px]"></TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {due.transactions?.map((tx: any, idx: number) => (
                                                                            <TableRow key={tx._id || idx} className="h-8 border-none hover:bg-muted/50">
                                                                                <TableCell className="py-1 text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                                                                <TableCell className="py-1 text-xs font-mono text-muted-foreground">
                                                                                    #{typeof tx.receiptId === 'object' ? tx.receiptId?.receiptNo : tx.receiptId?.slice(-6).toUpperCase()}
                                                                                </TableCell>
                                                                                <TableCell className="py-1 text-xs text-right font-mono font-medium">₹{tx.amount}</TableCell>
                                                                                <TableCell className="py-1 text-xs text-right text-muted-foreground">
                                                                                    {tx.receiptId?.account?._id ? (
                                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                                            {tx.receiptId.account.type === 'BANK' ?
                                                                                                <Landmark className="h-3 w-3" /> :
                                                                                                <Wallet className="h-3 w-3" />
                                                                                            }
                                                                                            <Link href={`/dashboard/accounts/${tx.receiptId.account._id}`} className="hover:underline hover:text-primary transition-colors">
                                                                                                {tx.receiptId.account.name}
                                                                                            </Link>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="flex items-center justify-end gap-1.5">
                                                                                            <Wallet className="h-3 w-3" />
                                                                                            {tx.receiptId?.account?.name || 'Cash'}
                                                                                        </span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell className="py-1 text-right">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-6 w-6"
                                                                                        onClick={() => {
                                                                                            const recId = tx.collectionReceipt || (typeof tx.receiptId === 'object' ? tx.receiptId?._id : tx.receiptId);
                                                                                            if (recId) window.open(`${API_URL}/collections/receipts/${recId}/pdf`, '_blank');
                                                                                        }}
                                                                                        title="View Receipt"
                                                                                    >
                                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
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
                            <Coins className="h-5 w-5 text-chart-1" /> Confirm Payment
                        </DialogTitle>
                        <DialogDescription>
                            Receive payment for <strong>{entityName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    {payingDue && (
                        <div className="grid gap-4 py-4">
                            <div className="p-3 bg-muted/40 rounded-lg border space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Period:</span>
                                    <span className="font-semibold">{payingDue.period}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount Due:</span>
                                    <span className="font-mono font-bold text-chart-1">₹{payingDue.amount - payingDue.paidAmount}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Amount to Pay</Label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    max={payingDue.amount - payingDue.paidAmount}
                                    disabled={payingDue.frequency !== 'Yearly'}
                                />
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
                                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleInitiateRejection}
                                disabled={sendingOtp}
                            >
                                {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                            </Button>
                            <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleConfirmPay} disabled={paying || !selectedAccount}>
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
                        <DialogTitle className="flex items-center gap-2 text-destructive">
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
