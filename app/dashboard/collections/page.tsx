"use client"

import { useState, useEffect, Fragment } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDues, getAccounts, payDue, initiateRejection, confirmRejection, API_URL, getArrearsSummary, sendArrearsReminder } from "@/lib/api"
import { Loader2, Search, Filter, ExternalLink, Calendar, Building2, User, Coins, Wallet, Landmark, ShieldAlert, LockKeyhole, ChevronDown, ChevronUp, History, Bell, Send, Printer as PrinterIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function CollectionsPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-black/20 p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Collections</h2>
                    <p className="text-sm text-muted-foreground">Manage and monitor all collected dues.</p>
                </div>
            </div>

            <Tabs defaultValue="member" className="space-y-4">
                <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                    <TabsList>
                        <TabsTrigger value="member" className="gap-1 sm:gap-2 text-xs sm:text-sm"><User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Member</TabsTrigger>
                        <TabsTrigger value="house" className="gap-1 sm:gap-2 text-xs sm:text-sm"><Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> House</TabsTrigger>
                        <TabsTrigger value="arrears" className="gap-1 sm:gap-2 text-xs sm:text-sm text-red-600 dark:text-red-400"><Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Arrears</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="member" className="space-y-4">
                    <CollectionTable type="Member" />
                </TabsContent>

                <TabsContent value="house" className="space-y-4">
                    <CollectionTable type="House" />
                </TabsContent>

                <TabsContent value="arrears" className="space-y-4">
                    <ArrearsTable />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function CollectionTable({ type }: { type: 'House' | 'Member' }) {
    const [dues, setDues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [periodFilter, setPeriodFilter] = useState("ALL")

    const [periods, setPeriods] = useState<string[]>([])

    // Payment State
    const [payingDue, setPayingDue] = useState<any>(null)
    const [isPayOpen, setIsPayOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState<number>(0)
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [loadingAccounts, setLoadingAccounts] = useState(false)
    const [paying, setPaying] = useState(false)

    // Expanded Row State for Yearly/Partial History
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

    // Rejection / OTP State
    const [isOtpOpen, setIsOtpOpen] = useState(false)
    const [otp, setOtp] = useState("")
    const [sendingOtp, setSendingOtp] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)

    useEffect(() => {
        fetchPeriods()
    }, [])

    useEffect(() => {
        fetchDues()
    }, [type, statusFilter, periodFilter])

    useEffect(() => {
        if (isPayOpen) {
            fetchAccounts()
        }
    }, [isPayOpen])

    const fetchPeriods = async () => {
        try {
            const data = await import("@/lib/api").then(m => m.getCollectionPeriods());
            if (Array.isArray(data)) setPeriods(data);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchDues = async () => {
        setLoading(true)
        try {
            const query: any = { entityType: type }
            if (statusFilter !== "ALL") query.status = statusFilter
            if (periodFilter !== "ALL") query.period = periodFilter

            const data = await getDues(query)
            setDues(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch collections")
        } finally {
            setLoading(false)
        }
    }

    const fetchAccounts = async () => {
        setLoadingAccounts(true)
        try {
            const data = await getAccounts()
            setAccounts(Array.isArray(data) ? data : [])
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
                paymentMethod: 'Cash'
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

    const handleInitiateRejection = async () => {
        if (!payingDue) return;

        setSendingOtp(true)
        try {
            await initiateRejection(payingDue._id)
            toast.success("OTP sent to administrators")
            setIsPayOpen(false)
            setIsOtpOpen(true)
            setOtp("")
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

    // Client-side search
    const filteredDues = dues.filter(due => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            due.entityId?.name?.toLowerCase().includes(searchLower) ||
            due.entityId?.customId?.toLowerCase().includes(searchLower) ||
            due.period?.toLowerCase().includes(searchLower)
        )
    })

    const handleViewReceipt = (due: any) => {
        const lastTx = due.transactions[due.transactions.length - 1];
        const recId = lastTx?.collectionReceipt || (typeof lastTx?.receiptId === 'object' ? lastTx.receiptId?._id : lastTx?.receiptId);

        if (recId) {
            // Direct PDF Download/View
            window.open(`https://api.tmj.org.in/api/collections/receipts/${recId}/pdf`, '_blank');
        }
    }

    const handlePrint = (due: any) => {
        const lastTx = due.transactions[due.transactions.length - 1];
        const recId = lastTx?.collectionReceipt || (typeof lastTx?.receiptId === 'object' ? lastTx.receiptId?._id : lastTx?.receiptId);

        if (recId) {
            window.location.href = `my.bluetoothprint.scheme://print/${recId}`;
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center justify-between space-y-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${type}...`}
                                className="pl-8 h-9 w-full sm:w-[200px] lg:w-[300px]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={periodFilter} onValueChange={setPeriodFilter}>
                                <SelectTrigger className="h-9 flex-1 sm:w-[130px]">
                                    <SelectValue placeholder="Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Periods</SelectItem>
                                    {periods.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 flex-1 sm:w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PARTIAL">Partial</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={fetchDues} className="gap-2 sm:hidden">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchDues} className="gap-2 hidden sm:flex">
                        <Filter className="h-4 w-4" /> Refresh
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-neutral-900">
                                <TableRow>
                                    <TableHead className="w-[90px] sm:w-[100px]">Period</TableHead>
                                    <TableHead>Payer ({type})</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Paid On</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Paid</TableHead>
                                    <TableHead className="w-[80px] sm:w-[120px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredDues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDues.map((due) => {
                                        const paidDate = due.transactions?.length > 0
                                            ? new Date(due.transactions[due.transactions.length - 1].date).toLocaleDateString('en-GB')
                                            : '-';

                                        const isYearly = due.frequency === 'Yearly' || due.status === 'PARTIAL';
                                        const isExpanded = expandedRowId === due._id;

                                        return (
                                            <Fragment key={due._id}>
                                                <TableRow className={cn("hover:bg-slate-50 dark:hover:bg-neutral-800/50", isExpanded && "bg-slate-50 dark:bg-neutral-800/50")}>
                                                    <TableCell className="font-medium text-xs sm:text-sm">
                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            {isYearly && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 p-0 text-muted-foreground shrink-0"
                                                                    onClick={() => setExpandedRowId(isExpanded ? null : due._id)}
                                                                >
                                                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                                </Button>
                                                            )}
                                                            <span className="truncate">{due.period}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            {type === 'House' ? (
                                                                <Link href={`/dashboard/houses/${due.entityId?._id}`} className="font-medium text-xs sm:text-sm hover:underline hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">
                                                                    {due.entityId?.name || 'Unknown'} <span className="text-muted-foreground ml-1 hidden xs:inline">({due.entityId?.customId || '-'})</span>
                                                                </Link>
                                                            ) : (
                                                                <>
                                                                    <Link href={`/dashboard/members/${due.entityId?._id}`} className="font-medium text-xs sm:text-sm hover:underline hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">
                                                                        {due.entityId?.name || 'Unknown'} <span className="text-muted-foreground ml-1 hidden xs:inline">({due.entityId?.customId || '-'})</span>
                                                                    </Link>
                                                                    {due.entityId?.houseId && (
                                                                        <Link href={`/dashboard/houses/${due.entityId.houseId._id}`} className="text-[10px] text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 mt-0.5">
                                                                            <Building2 className="h-3 w-3 shrink-0" />
                                                                            <span className="truncate max-w-[80px] sm:max-w-none">{due.entityId.houseId.customId || 'View House'}</span>
                                                                        </Link>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px] px-1.5 sm:px-2 py-0.5 border-0 font-medium whitespace-nowrap",
                                                            due.status === 'PAID' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                                due.status === 'PARTIAL' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                                    due.status === 'REJECTED' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                        )}>
                                                            {due.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground font-mono hidden sm:table-cell">{paidDate}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs sm:text-sm whitespace-nowrap">₹{due.amount}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs sm:text-sm text-green-600 font-bold hidden sm:table-cell whitespace-nowrap">
                                                        {due.paidAmount > 0 ? `₹${due.paidAmount}` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                            {(due.status === 'PAID' || due.status === 'PARTIAL') && due.transactions?.length > 0 && !isYearly && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                                                        onClick={() => handleViewReceipt(due)}
                                                                        title="View Receipt"
                                                                    >
                                                                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                                                        onClick={() => handlePrint(due)}
                                                                        title="Print Receipt"
                                                                    >
                                                                        <PrinterIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {due.status !== 'PAID' && due.status !== 'REJECTED' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                                    onClick={() => openPayDialog(due)}
                                                                >
                                                                    Pay
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow className="bg-slate-50/50 dark:bg-neutral-900/20">
                                                        <TableCell colSpan={7} className="p-0">
                                                            <div className="p-3 sm:p-4 pl-6 sm:pl-12 border-b overflow-x-auto">
                                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                                                                    <History className="h-3 w-3" /> Payment History
                                                                </h4>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="h-8 hover:bg-transparent">
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Date</TableHead>
                                                                            <TableHead className="h-8 text-xs whitespace-nowrap">Receipt No</TableHead>
                                                                            <TableHead className="h-8 text-xs text-right whitespace-nowrap">Amount</TableHead>
                                                                            <TableHead className="h-8 text-xs text-right hidden sm:table-cell whitespace-nowrap">Deposit Account</TableHead>
                                                                            <TableHead className="h-8 text-xs w-[50px] sm:w-[60px]"></TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {due.transactions?.map((tx: any, idx: number) => (
                                                                            <TableRow key={tx._id || idx} className="h-8 border-none hover:bg-slate-100 dark:hover:bg-neutral-800">
                                                                                <TableCell className="py-1 text-xs whitespace-nowrap">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                                                                <TableCell className="py-1 text-xs font-mono text-muted-foreground whitespace-nowrap">
                                                                                    #{typeof tx.receiptId === 'object' ? tx.receiptId?.receiptNo : tx.receiptId?.slice(-6).toUpperCase()}
                                                                                </TableCell>
                                                                                <TableCell className="py-1 text-xs text-right font-mono font-medium whitespace-nowrap">₹{tx.amount}</TableCell>
                                                                                <TableCell className="py-1 text-xs text-right text-muted-foreground hidden sm:table-cell">
                                                                                    {tx.receiptId?.account?._id ? (
                                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                                            {tx.receiptId.account.type === 'BANK' ?
                                                                                                <Landmark className="h-3 w-3 shrink-0" /> :
                                                                                                <Wallet className="h-3 w-3 shrink-0" />
                                                                                            }
                                                                                            <Link href={`/dashboard/accounts/${tx.receiptId.account._id}`} className="hover:underline hover:text-primary transition-colors truncate max-w-[100px]">
                                                                                                {tx.receiptId.account.name}
                                                                                            </Link>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="flex items-center justify-end gap-1.5">
                                                                                            <Wallet className="h-3 w-3 shrink-0" />
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
                                                                                            if (recId) window.open(`https://api.tmj.org.in/api/collections/receipts/${recId}/pdf`, '_blank');
                                                                                        }}
                                                                                        title="View Receipt"
                                                                                    >
                                                                                        <ExternalLink className="h-3 w-3 text-slate-500" />
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                        {(!due.transactions || due.transactions.length === 0) && (
                                                                            <TableRow>
                                                                                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-2">No transactions recorded.</TableCell>
                                                                            </TableRow>
                                                                        )}
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
                    </div>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-green-600" /> Confirm Payment
                        </DialogTitle>
                        <DialogDescription>
                            Receive payment for <strong>{payingDue?.entityId?.name}</strong>
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
        </>
    )
}

function ArrearsTable() {
    const [arrears, setArrears] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState("All")
    const [remindingId, setRemindingId] = useState<string | null>(null)

    useEffect(() => {
        fetchArrears()
    }, [typeFilter])

    const fetchArrears = async () => {
        setLoading(true)
        try {
            const data = await getArrearsSummary({ entityType: typeFilter })
            setArrears(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch arrears summary")
        } finally {
            setLoading(false)
        }
    }

    const handleSendReminder = async (item: any) => {
        setRemindingId(item.entityId)
        try {
            await sendArrearsReminder({
                entityId: item.entityId,
                entityType: item.entityType
            })
            toast.success("Summary reminder sent via WhatsApp")
        } catch (error: any) {
            toast.error(error.message || "Failed to send reminder")
        } finally {
            setRemindingId(null)
        }
    }

    return (
        <Card className="border-red-100 dark:border-red-900/30">
            <CardHeader className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center justify-between space-y-0 bg-red-50/50 dark:bg-red-950/10">
                <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                        <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" /> Pending Arrears
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Outstanding balances across all periods.
                    </CardDescription>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[150px]">
                        <SelectValue placeholder="All Entities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Entities</SelectItem>
                        <SelectItem value="House">Houses Only</SelectItem>
                        <SelectItem value="Member">Members Only</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entity</TableHead>
                                <TableHead className="hidden sm:table-cell">Type</TableHead>
                                <TableHead className="text-center whitespace-nowrap">Pending</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Outstanding</TableHead>
                                <TableHead className="w-[100px] sm:w-[150px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : arrears.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No arrears found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                arrears.map((item) => (
                                    <TableRow key={item.entityId}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs sm:text-sm">{item.entity?.name || 'Unknown'}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{item.entity?.customId || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.entityType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-bold text-xs">
                                                {item.pendingCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-red-600 text-xs sm:text-sm whitespace-nowrap">
                                            ₹{item.totalAmount}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 sm:h-8 gap-1 sm:gap-2 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-950/20"
                                                onClick={() => handleSendReminder(item)}
                                                disabled={remindingId === item.entityId}
                                            >
                                                {remindingId === item.entityId ? (
                                                    <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                )}
                                                <span className="hidden xs:inline">Remind</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
