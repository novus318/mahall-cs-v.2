"use client"

import { useEffect, useState } from "react"
import { getMembers, deleteMember, importMembers } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, UserPlus, Loader2, Search, ChevronLeft, ChevronRight, Pencil, Download, Upload, FileDown } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MemberDialog } from "@/components/dashboard/MemberDialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Member {
    _id: string;
    customId: string;
    name: string;
    gender: string;
    dateOfBirth: string;
    house?: { name: string; customId: string };
    family?: { name: string; customId: string };
    mobile: string;
}

interface ImportResult {
    successCount: number;
    errorCount: number;
    errors: string[];
    warnings: string[];
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<Member | null>(null)

    // Import State
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)

    // Pagination & Search
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState("")
    const [total, setTotal] = useState(0)
    const [limit, setLimit] = useState(10)

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)

    const fetchMembers = async () => {
        setLoading(true)
        try {
            // Updated to pass pagination params
            const data = await getMembers({ page, limit, search })
            if (Array.isArray(data)) {
                // Handle legacy response if backend ignores params or returns plain array
                setMembers(data as Member[])
                setTotal(data.length)
                setTotalPages(1) // No pagination info
            } else {
                // Expecting { members, page, pages, total }
                setMembers((data.members || []) as Member[])
                setPage(data.page || 1)
                setTotalPages(data.pages || 1)
                setTotal(data.total || 0)
            }
        } catch (error: any) {
            toast.error("Failed to fetch members")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMembers()
        }, 300)
        return () => clearTimeout(delayDebounceFn)
    }, [page, search, limit])

    const confirmDelete = (id: string) => {
        setDeletingMemberId(id)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingMemberId) return
        try {
            await deleteMember(deletingMemberId)
            toast.success("Member deleted successfully")
            setDeletingMemberId(null)
            setIsDeleteDialogOpen(false)
            fetchMembers()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete member")
        }
    }

    const handleImport = async () => {
        if (!importFile) return;

        setImporting(true);
        setImportResult(null);
        try {
            const formData = new FormData();
            formData.append('file', importFile);

            // Assuming we need a new API method 'importMembers' in lib/api.ts
            // But for now let's use a direct fetch or assume it exists. 
            // Better to update api.ts next.
            const res = await importMembers(importFile); // Will implement this in api.ts

            setImportResult(res);

            if (res.successCount > 0) {
                toast.success(`Imported ${res.successCount} members.`);
                fetchMembers();
                // Do not close automatically so user can see results
            } else {
                toast.error("Import failed or no members added.");
            }
        } catch (error: any) {
            toast.error(error.message || "Import failed");
        } finally {
            setImporting(false);
        }
    }

    const downloadSample = () => {
        const headers = ["Name", "Gender", "HouseID", "FamilyID", "Mobile", "DOB", "BloodGroup", "MaritalStatus", "FatherID", "MotherID", "SpouseID"];
        const rows = [
            ["John Doe", "Male", "CYS001", "CYS", "0501234567", "1980-01-01", "A+", "Married", "", "", ""],
            ["Jane Doe", "Female", "CYS001", "CYS", "0507654321", "1985-05-05", "O+", "Married", "", "", "CYS00001"]
        ];
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "members_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Members</h2>
                    <p className="text-muted-foreground text-sm">Directory of all community members.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        setIsImportOpen(true)
                        setImportResult(null)
                        setImportFile(null)
                    }}>
                        <Upload className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                        try {
                            toast.info("Preparing export...")
                            const data = await getMembers({ page: 1, limit: 10000, search: "" })
                            const membersToExport = Array.isArray(data) ? data : (data.members || [])

                            if (membersToExport.length === 0) {
                                toast.warning("No members to export")
                                return
                            }

                            const headers = ["ID", "Name", "Gender", "House", "Family", "Mobile", "DOB"]
                            const rows = membersToExport.map((m: Member) => [
                                m.customId || "",
                                `"${m.name}"`,
                                m.gender || "",
                                `"${m.house?.name || ""}"`,
                                `"${m.family?.name || "Independent"}"`,
                                `"${m.mobile || ""}"`,
                                m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : ""
                            ])

                            const csvContent = [
                                headers.join(","),
                                ...rows.map((row: any[]) => row.join(","))
                            ].join("\n")

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                            const link = document.createElement("a")
                            const url = URL.createObjectURL(blob)
                            link.setAttribute("href", url)
                            link.setAttribute("download", `members_export_${new Date().toISOString().split('T')[0]}.csv`)
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            toast.success("Export started")
                        } catch (error) {
                            toast.error("Failed to export members")
                        }
                    }}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button onClick={() => {
                        setEditingMember(null)
                        setIsAddMemberOpen(true)
                    }} size="sm">
                        <UserPlus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                </div>
            </div>

            <MemberDialog
                open={isAddMemberOpen}
                onOpenChange={(val) => {
                    setIsAddMemberOpen(val)
                    if (!val) setEditingMember(null)
                }}
                onSuccess={() => fetchMembers()}
                memberToEdit={editingMember}
            />

            {/* Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Import Members</DialogTitle>
                        <DialogDescription>
                            Upload an Excel/CSV file. Use Member Custom IDs for relationships (FatherID, MotherID, SpouseID).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>1. Download Template</Label>
                            <Button variant="outline" onClick={downloadSample} className="w-full sm:w-auto self-start">
                                <FileDown className="mr-2 h-4 w-4" /> Download Sample CSV
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="import-file">2. Upload File</Label>
                            <Input
                                id="import-file"
                                type="file"
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={(e) => {
                                    setImportFile(e.target.files?.[0] || null)
                                    setImportResult(null)
                                }}
                            />
                        </div>
                        {importResult && (
                            <div className={cn(
                                "rounded-md px-4 py-3 text-sm border",
                                (importResult.errorCount > 0 || (importResult.warnings && importResult.warnings.length > 0)) ? "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800" : "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold flex items-center gap-2 text-sm">
                                        {(importResult.errorCount > 0 || (importResult.warnings && importResult.warnings.length > 0)) ? (
                                            <span className="text-amber-600 dark:text-amber-500">Completed with Issues</span>
                                        ) : (
                                            <span className="text-green-700 dark:text-green-400">Import Successful</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">Added:</span>
                                            <span className="font-mono font-bold text-green-600">{importResult.successCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">Skipped:</span>
                                            <span className="font-mono font-bold text-red-600">{importResult.errorCount || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <ScrollArea className="h-[120px]">
                                    <div className="space-y-1">
                                        {importResult.errors?.map((e: string, i: number) => (
                                            <div key={`err-${i}`} className="text-[11px] text-red-600 font-mono flex items-start gap-1.5 leading-tight">
                                                <span>•</span> <span>{e}</span>
                                            </div>
                                        ))}
                                        {importResult.warnings?.map((w: string, i: number) => (
                                            <div key={`warn-${i}`} className="text-[11px] text-amber-600 font-mono flex items-start gap-1.5 leading-tight">
                                                <span>•</span> <span>{w}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {importResult ? (
                            <Button onClick={() => setIsImportOpen(false)}>Done</Button>
                        ) : (
                            <Button onClick={handleImport} disabled={!importFile || importing}>
                                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {importing ? "Importing..." : "Start Import"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the member from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="border shadow-sm">
                <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-semibold">All Members</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {members.length} of {total} records
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, house..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-9 text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[100px] h-9 text-xs font-semibold">ID</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Name</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">House</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Family</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Mobile</TableHead>
                                <TableHead className="text-right h-9 text-xs font-semibold w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                    </TableCell>
                                </TableRow>
                            ) : members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                        No members found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                        <TableCell className="py-2 text-sm font-mono font-medium">{member.customId || "-"}</TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{member.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {member.gender}, {new Date(member.dateOfBirth).getFullYear()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground">
                                            {member.house?.name || "-"}
                                        </TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground">
                                            {member.family?.name || "Independent"}
                                        </TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground font-mono">
                                            {member.mobile || "-"}
                                        </TableCell>
                                        <TableCell className="py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => {
                                                        setEditingMember(member)
                                                        setIsAddMemberOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-amber-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-700"
                                                    onClick={() => confirmDelete(member._id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Footer */}
                <div className="p-4 border-t grid grid-cols-3 sm:grid-cols-3 items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                            Rows
                        </p>
                        <Input
                            type="number"
                            min="1"
                            className="h-8 w-[70px]"
                            value={limit}
                            onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (val > 0) {
                                    setLimit(val)
                                    setPage(1)
                                }
                            }}
                        />
                    </div>

                    <div className="hidden md:flex items-center justify-center text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>

                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
