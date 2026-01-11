"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDues } from "@/lib/api"
import { Loader2, Search, Filter, ExternalLink, Calendar, Building2, User } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CollectionsPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-black/20 p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Collections</h2>
                <p className="text-muted-foreground">Manage and monitor all collected dues.</p>
            </div>

            <Tabs defaultValue="house" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="house" className="gap-2"><Building2 className="h-4 w-4" /> House Collections</TabsTrigger>
                    <TabsTrigger value="member" className="gap-2"><User className="h-4 w-4" /> Member Collections</TabsTrigger>
                </TabsList>

                <TabsContent value="house" className="space-y-4">
                    <CollectionTable type="House" />
                </TabsContent>

                <TabsContent value="member" className="space-y-4">
                    <CollectionTable type="Member" />
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

    useEffect(() => {
        fetchPeriods()
    }, [])

    useEffect(() => {
        fetchDues()
    }, [type, statusFilter, periodFilter])

    const fetchPeriods = async () => {
        try {
            // Lazy import or use api wrapper
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

    // Client-side search for now (can be optimized to backend)
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
        const recId = lastTx?.collectionReceipt || lastTx?.receiptId;

        if (recId) {
            window.location.href = `/dashboard/collection-receipts/${recId}`;
        }
    }

    return (
        <Card>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${type}...`}
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
                            <SelectItem value="REJECTED">Rejected</SelectItem>
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
                            <TableHead>Payer ({type})</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid On</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
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

                                return (
                                    <TableRow key={due._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                                        <TableCell className="font-medium">{due.period}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {type === 'House' ? (
                                                    <Link href={`/dashboard/houses/${due.entityId?._id}`} className="font-medium text-sm hover:underline hover:text-primary transition-colors">
                                                        {due.entityId?.name || 'Unknown'} <span className="text-muted-foreground ml-1">({due.entityId?.customId || '-'})</span>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Link href={`/dashboard/members/${due.entityId?._id}`} className="font-medium text-sm hover:underline hover:text-primary transition-colors">
                                                            {due.entityId?.name || 'Unknown'} <span className="text-muted-foreground ml-1">({due.entityId?.customId || '-'})</span>
                                                        </Link>
                                                        {due.entityId?.houseId && (
                                                            <Link href={`/dashboard/houses/${due.entityId.houseId._id}`} className="text-[10px] text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 mt-0.5">
                                                                <Building2 className="h-3 w-3" />
                                                                {due.entityId.houseId.customId || 'View House'}
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] px-2 py-0.5 border-0 font-medium",
                                                due.status === 'PAID' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                    due.status === 'PARTIAL' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                        due.status === 'REJECTED' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                            )}>
                                                {due.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">{paidDate}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">₹{due.amount}</TableCell>
                                        <TableCell className="text-right font-mono text-sm text-green-600 font-bold">
                                            {due.paidAmount > 0 ? `₹${due.paidAmount}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {(due.status === 'PAID' || due.status === 'PARTIAL') && due.transactions?.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleViewReceipt(due)}
                                                    title="View Receipt"
                                                >
                                                    <ExternalLink className="h-4 w-4 text-primary" />
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
    )
}
