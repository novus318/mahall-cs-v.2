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
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Rent · Collections
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Rent Collections</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Manage and monitor all collected rents.</p>
                </div>
            </div>

            <Tabs defaultValue="dues" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dues" className="gap-2"><Calendar className="h-4 w-4" /> Rent Dues</TabsTrigger>
                    <TabsTrigger value="arrears" className="gap-2 text-destructive"><Bell className="h-4 w-4" /> Arrears Summary</TabsTrigger>
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
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 20
    const [periods, setPeriods] = useState<string[]>([])
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

    useEffect(() => { fetchPeriods() }, [])
    useEffect(() => { fetchDues() }, [statusFilter, periodFilter, page])
    useEffect(() => { setPage(1) }, [statusFilter, periodFilter, startDate, endDate])

    const fetchPeriods = async () => {
        try {
            const data = await getRentPeriods();
            if (Array.isArray(data)) setPeriods(data);
        } catch (err) { console.error(err) }
    }

    const fetchDues = async () => {
        setLoading(true)
        try {
            const query: any = { page, limit }
            if (statusFilter !== "ALL") query.status = statusFilter
            if (periodFilter !== "ALL") query.period = periodFilter
            if (startDate) query.startDate = startDate
            if (endDate) query.endDate = endDate
            const result = await getRentDues(query)
            setDues(Array.isArray(result.data) ? result.data : [])
            if (result.pagination) {
                setTotalPages(result.pagination.totalPages)
                setTotal(result.pagination.total)
            }
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
        <>
        <Card className="bg-card shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col w-full gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search tenant..."
                            className="h-9 w-full bg-background pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Input
                            type="date"
                            className="h-9 bg-background w-full sm:w-[130px] text-xs flex-1 sm:flex-initial"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            className="h-9 bg-background w-full sm:w-[130px] text-xs flex-1 sm:flex-initial"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="h-9 bg-background flex-1 sm:flex-initial sm:w-[130px]">
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
                            <SelectTrigger className="h-9 bg-background flex-1 sm:flex-initial sm:w-[130px]">
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
                </div>
                <Button variant="outline" size="sm" onClick={fetchDues} className="gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4" /> Refresh
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] font-semibold text-xs uppercase tracking-wider">Period</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Tenant</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="hidden font-semibold text-xs uppercase tracking-wider sm:table-cell">Paid On</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Collected</TableHead>
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
                                        <TableRow className={cn("hover:bg-muted/50", isExpanded && "bg-muted/40")}>
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
                                                    due.status === 'PAID' ? "bg-chart-1/10 text-chart-1" :
                                                        due.status === 'PARTIAL' ? "bg-chart-2/10 text-chart-2" :
                                                            "bg-muted/60 text-muted-foreground"
                                                )}>
                                                    {due.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{paidDate}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">₹{due.amount}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-chart-1 font-bold">
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
                                                            if (lastTx.receipt) window.open(`https://api.tmj.org.in/api/receipts/${lastTx.receipt}/pdf`, '_blank');
                                                        }}
                                                        title="View Receipt"
                                                    >
                                                        <ExternalLink className="h-4 w-4 text-primary" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow className="bg-muted/40">
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
                                                                    <TableRow key={tx._id || idx} className="h-8 border-none hover:bg-muted/50">
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
                                                                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
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

        {totalPages > 1 && (
            <div className="flex flex-col gap-2 items-center justify-between px-2 sm:flex-row">
                <div className="text-xs text-muted-foreground">
                    Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        )}
        </>
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
        <Card className="border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-destructive/5 p-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                        <ShieldAlert className="h-5 w-5" /> Pending Rent Arrears Summary
                    </CardTitle>
                    <CardDescription>
                        Overview of total outstanding rent balances across all contracts.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Tenant</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Phone</TableHead>
                            <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Pending Months</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Total Outstanding</TableHead>
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
                                    <TableCell className="text-right font-mono font-bold text-destructive">
                                        ₹{item.totalAmount}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-2 border-chart-1/30 text-chart-1 hover:bg-chart-1/10"
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
