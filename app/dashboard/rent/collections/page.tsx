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
import { getRentDues, getAccounts, getRentPeriods, getRentArrearsSummary, sendRentReminder } from "@/lib/api"
import { Loader2, Search, Filter, ExternalLink, Calendar, User, Coins, Wallet, Landmark, ShieldAlert, Bell, Send, ChevronDown, ChevronUp, History } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function RentCollectionsPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-black/20 p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Rent Collections</h2>
                <p className="text-muted-foreground">Manage and monitor all collected rents.</p>
            </div>

            <Tabs defaultValue="dues" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dues" className="gap-2"><Calendar className="h-4 w-4" /> Rent Dues</TabsTrigger>
                    <TabsTrigger value="arrears" className="gap-2 text-red-600 dark:text-red-400"><Bell className="h-4 w-4" /> Arrears Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="dues" className="space-y-4">
                    <RentDuesTable />
                </TabsContent>

                <TabsContent value="arrears" className="space-y-4">
                    <RentArrearsTable />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function RentDuesTable() {
    const [dues, setDues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [periodFilter, setPeriodFilter] = useState("ALL")
    const [periods, setPeriods] = useState<string[]>([])
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

    useEffect(() => { fetchPeriods() }, [])
    useEffect(() => { fetchDues() }, [statusFilter, periodFilter])

    const fetchPeriods = async () => {
        try {
            const data = await getRentPeriods();
            if (Array.isArray(data)) setPeriods(data);
        } catch (err) { console.error(err) }
    }

    const fetchDues = async () => {
        setLoading(true)
        try {
            const query: any = {}
            if (statusFilter !== "ALL") query.status = statusFilter
            if (periodFilter !== "ALL") query.period = periodFilter
            const data = await getRentDues(query)
            setDues(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error("Failed to fetch rent dues")
        } finally {
            setLoading(false)
        }
    }

    const filteredDues = dues.filter(due => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            due.contract?.tenant?.name?.toLowerCase().includes(q) ||
            due.contract?.tenant?.phone?.toLowerCase().includes(q) ||
            due.monthYear?.toLowerCase().includes(q)
        )
    })

    return (
        <Card>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tenant..."
                            className="pl-8 h-9 w-[200px] lg:w-[300px]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                        <SelectTrigger className="h-9 w-[130px]">
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
                        <SelectTrigger className="h-9 w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PARTIAL">Partial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDues} className="gap-2">
                    <Filter className="h-4 w-4" /> Refresh
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-neutral-900">
                        <TableRow>
                            <TableHead className="w-[100px]">Period</TableHead>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid On</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Collected</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
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
                                const isPartial = due.status === 'PARTIAL';
                                const isExpanded = expandedRowId === due._id;

                                return (
                                    <Fragment key={due._id}>
                                        <TableRow className={cn("hover:bg-slate-50 dark:hover:bg-neutral-800/50", isExpanded && "bg-slate-50 dark:bg-neutral-800/50")}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {isPartial && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 p-0 text-muted-foreground"
                                                            onClick={() => setExpandedRowId(isExpanded ? null : due._id)}
                                                        >
                                                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                        </Button>
                                                    )}
                                                    {due.monthYear}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/contracts/${due.contract?._id}`} className="font-medium text-sm hover:underline hover:text-primary transition-colors">
                                                    {due.contract?.tenant?.name || 'Unknown'}
                                                </Link>
                                                <div className="text-[10px] text-muted-foreground">{due.contract?.tenant?.phone || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] px-2 py-0.5 border-0 font-medium",
                                                    due.status === 'PAID' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                        due.status === 'PARTIAL' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                )}>
                                                    {due.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{paidDate}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">₹{due.amount}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-green-600 font-bold">
                                                {due.collectedAmount > 0 ? `₹${due.collectedAmount}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(due.status === 'PAID' || due.status === 'PARTIAL') && due.transactions?.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            const lastTx = due.transactions[due.transactions.length - 1];
                                                            if (lastTx.receipt) window.open(`/api/receipts/${lastTx.receipt}/pdf`, '_blank');
                                                        }}
                                                        title="View Receipt"
                                                    >
                                                        <ExternalLink className="h-4 w-4 text-primary" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/50 dark:bg-neutral-900/20">
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="p-4 pl-12 border-b">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                                                            <History className="h-3 w-3" /> Payment History
                                                        </h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="h-8 hover:bg-transparent">
                                                                    <TableHead className="h-8 text-xs">Date</TableHead>
                                                                    <TableHead className="h-8 text-xs">Receipt No</TableHead>
                                                                    <TableHead className="h-8 text-xs text-right">Amount</TableHead>
                                                                    <TableHead className="h-8 text-xs w-[60px]"></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {due.transactions?.map((tx: any, idx: number) => (
                                                                    <TableRow key={tx._id || idx} className="h-8 border-none hover:bg-slate-100 dark:hover:bg-neutral-800">
                                                                        <TableCell className="py-1 text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                                                        <TableCell className="py-1 text-xs font-mono text-muted-foreground">#{tx.receipt?.toString().slice(-6).toUpperCase() || '-'}</TableCell>
                                                                        <TableCell className="py-1 text-xs text-right font-mono font-medium">₹{tx.amount}</TableCell>
                                                                        <TableCell className="py-1 text-right">
                                                                            {tx.receipt && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-6 w-6"
                                                                                    onClick={() => window.open(`/api/receipts/${tx.receipt}/pdf`, '_blank')}
                                                                                    title="View Receipt"
                                                                                >
                                                                                    <ExternalLink className="h-3 w-3 text-slate-500" />
                                                                                </Button>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                                {(!due.transactions || due.transactions.length === 0) && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-2">No transactions recorded.</TableCell>
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
            </CardContent>
        </Card>
    )
}

function RentArrearsTable() {
    const [arrears, setArrears] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [remindingId, setRemindingId] = useState<string | null>(null)

    useEffect(() => { fetchArrears() }, [])

    const fetchArrears = async () => {
        setLoading(true)
        try {
            const data = await getRentArrearsSummary()
            setArrears(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error("Failed to fetch arrears summary")
        } finally {
            setLoading(false)
        }
    }

    const handleSendReminder = async (item: any) => {
        setRemindingId(item.contractId)
        try {
            await sendRentReminder({ contractId: item.contractId })
            toast.success("Summary reminder sent via WhatsApp")
        } catch (error: any) {
            toast.error(error.message || "Failed to send reminder")
        } finally {
            setRemindingId(null)
        }
    }

    return (
        <Card className="border-red-100 dark:border-red-900/30">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-red-50/50 dark:bg-red-950/10">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                        <ShieldAlert className="h-5 w-5" /> Pending Rent Arrears Summary
                    </CardTitle>
                    <CardDescription>
                        Overview of total outstanding rent balances across all contracts.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-center">Pending Months</TableHead>
                            <TableHead className="text-right">Total Outstanding</TableHead>
                            <TableHead className="w-[150px]"></TableHead>
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
                                <TableRow key={item.contractId}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link href={`/dashboard/contracts/${item.contractId}`} className="font-medium text-sm hover:underline hover:text-primary">
                                                {item.contract?.tenant?.name || 'Unknown'}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.contract?.tenant?.phone || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-bold">
                                            {item.pendingCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-red-600">
                                        ₹{item.totalAmount}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-950/20"
                                            onClick={() => handleSendReminder(item)}
                                            disabled={remindingId === item.contractId}
                                        >
                                            {remindingId === item.contractId ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Send className="h-3.5 w-3.5" />
                                            )}
                                            Remind
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
