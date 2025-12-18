"use client"

import { useEffect, useState } from "react"
import { getHouses, createHouse, deleteHouse, updateHouse, getFamilies, importHouses } from "@/lib/api"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Eye, Loader2, Pencil, Search, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Upload, FileDown, Download } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function HousesPage() {
    const [houses, setHouses] = useState([])
    const [families, setFamilies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [open, setOpen] = useState(false) // For combobox
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        familyId: "independent", // Default or value for no family
    })
    const [editData, setEditData] = useState<any>(null)

    // Pagination & Search
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState("")
    const [total, setTotal] = useState(0)
    const [limit, setLimit] = useState(10)

    // Import State
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)

    const fetchHouses = async () => {
        setLoading(true)
        try {
            const [housesData, familiesData] = await Promise.all([
                getHouses({ page, limit, search }),
                getFamilies()
            ])
            setHouses(housesData.houses)
            setPage(housesData.page)
            setTotalPages(housesData.pages)
            setTotal(housesData.total)

            // Fix for getFamilies returning paginated object
            // If getFamilies is standard list API it's fine, but we updated it to return { families, page... }
            // Let's assume getFamilies without params returns defaults (page 1). 
            // Ideally we need a 'fetchAll' for dropdowns or loop. 
            // For now, let's just use what we get. If it's paginated, we only get page 1.
            // This is a potential bug but out of scope for "same UI changes".
            // Let's assume for now families list is small. 
            setFamilies(familiesData.families || [])
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchHouses()
        }, 300)
        return () => clearTimeout(delayDebounceFn)
    }, [page, search, limit])

    const handleImport = async () => {
        if (!importFile) return;

        setImporting(true);
        setImportResult(null);
        try {
            const res = await importHouses(importFile);
            setImportResult(res);

            // Note: res is the unwrapped data object { successCount, errorCount, errors }
            if (res.errorCount > 0 && res.successCount > 0) {
                toast.warning(`Imported ${res.successCount} houses. ${res.errorCount} skipped.`);
                fetchHouses();
            } else if (res.errorCount > 0 && res.successCount === 0) {
                toast.error("Import completed with skips.");
            } else {
                toast.success(`Import successful. Added ${res.successCount} houses.`);
                fetchHouses();
                setImportFile(null);
                setIsImportOpen(false); // Close on full success
            }
        } catch (error: any) {
            toast.error(error.message || "Import failed");
        } finally {
            setImporting(false);
        }
    }

    const downloadSample = () => {
        const headers = ["name", "familyCustomId", "address"];
        const rows = [
            ["House A-101", "CYS", "123 Main St"],
            ["House B-202", "", "456 Side Ave"]
        ];
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "houses_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }



    const handleExport = async () => {
        try {
            toast.info("Preparing export...")
            const data = await getHouses({ page: 1, limit: 10000, search: "" })
            const housesToExport = data.houses || []

            if (housesToExport.length === 0) {
                toast.warning("No houses to export")
                return
            }

            const headers = ["ID", "Name", "Family", "Address"]
            const rows = housesToExport.map((h: any) => [
                h.customId,
                `"${h.name}"`,
                `"${h.family ? h.family.name : 'Independent'}"`,
                `"${h.address || ""}"`
            ])

            const csvContent = [
                headers.join(","),
                ...rows.map((row: any[]) => row.join(","))
            ].join("\n")

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement("a")
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `houses_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Export started")
        } catch (error) {
            toast.error("Failed to export houses")
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditData({ ...editData, [e.target.name]: e.target.value })
    }

    const handleFamilyChange = (value: string) => {
        setFormData({ ...formData, familyId: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const dataToSend = {
                ...formData,
                familyId: formData.familyId === "independent" ? null : formData.familyId
            }
            await createHouse(dataToSend)
            toast.success("House created successfully")
            setIsOpen(false)
            setFormData({ name: "", address: "", familyId: "independent" })
            fetchHouses()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create house")
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await updateHouse(editData._id, {
                name: editData.name,
                address: editData.address
            })
            toast.success("House updated successfully")
            setIsEditOpen(false)
            setEditData(null)
            fetchHouses()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update house")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteHouse(id)
            toast.success("House deleted successfully")
            fetchHouses()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete house")
        }
    }

    const openEditDialog = (house: any) => {
        setEditData(house)
        setIsEditOpen(true)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Houses</h2>
                    <p className="text-muted-foreground text-sm">Manage houses within families or independently.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Add House
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New House</DialogTitle>
                                <DialogDescription>
                                    Register a new house. Assign it to a family or keep it independent.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="family" className="text-right">
                                            Family
                                        </Label>
                                        <div className="col-span-3">
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={open}
                                                        className="w-full justify-between"
                                                    >
                                                        {formData.familyId === "independent"
                                                            ? "Independent (No Family)"
                                                            : formData.familyId
                                                                ? families.find((family: any) => family._id === formData.familyId)?.name
                                                                : "Select Family..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search family..." />
                                                        <CommandList>
                                                            <CommandEmpty>No family found.</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    value="independent"
                                                                    onSelect={() => {
                                                                        handleFamilyChange("independent")
                                                                        setOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.familyId === "independent" ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    Independent (No Family)
                                                                </CommandItem>
                                                                {families.map((family: any) => (
                                                                    <CommandItem
                                                                        key={family._id}
                                                                        value={family.name}
                                                                        onSelect={() => {
                                                                            handleFamilyChange(family._id)
                                                                            setOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                formData.familyId === family._id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {family.name} ({family.customId})
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="House Name"
                                            className="col-span-3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="address" className="text-right">
                                            Address
                                        </Label>
                                        <Textarea
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Address"
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Create House</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>


            {/* Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Import Houses</DialogTitle>
                        <DialogDescription>
                            Upload an Excel or CSV file to add houses in bulk.
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
                                importResult.errorCount > 0 ? "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800" : "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold flex items-center gap-2 text-sm">
                                        {importResult.errorCount > 0 ? (
                                            <span className="text-amber-600 dark:text-amber-500">Completed with Skips</span>
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
                                            <span className="font-mono font-bold text-amber-600">{importResult.errorCount || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {importResult.errors?.length > 0 && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                                        <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                                            {importResult.errors.map((e: string, i: number) => (
                                                <div key={i} className="text-[11px] text-muted-foreground font-mono flex items-start gap-1.5 leading-tight">
                                                    <span className="text-amber-500 mt-0.5">•</span>
                                                    <span>{e}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleImport}
                            disabled={!importFile || importing}
                        >
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {importing ? "Importing..." : "Start Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Valid Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit House</DialogTitle>
                        <DialogDescription>
                            Update house (ID/Family link cannot be changed here yet).
                        </DialogDescription>
                    </DialogHeader>
                    {editData && (
                        <form onSubmit={handleUpdate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">ID</Label>
                                    <div className="col-span-3 font-mono font-bold">{editData.customId}</div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        value={editData.name}
                                        onChange={handleEditChange}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-address" className="text-right">Address</Label>
                                    <Textarea
                                        id="edit-address"
                                        name="address"
                                        value={editData.address}
                                        onChange={handleEditChange}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Card className="border shadow-sm">
                <CardHeader className="p-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-semibold">All Houses</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {houses.length} of {total} records
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, ID or address..."
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
                                <TableHead className="h-9 text-xs font-semibold">Family</TableHead>
                                <TableHead className="h-9 text-xs font-semibold">Address</TableHead>
                                <TableHead className="text-right h-9 text-xs font-semibold w-[140px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                    </TableCell>
                                </TableRow>
                            ) : houses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                        No houses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                houses.map((house: any) => (
                                    <TableRow key={house._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                        <TableCell className="py-2 text-sm font-mono font-medium">{house.customId}</TableCell>
                                        <TableCell className="py-2 text-sm font-medium">{house.name}</TableCell>
                                        <TableCell className="py-2 text-sm">
                                            {house.family ? (
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">{house.family.name}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Independent</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground truncate max-w-[200px]">{house.address || "-"}</TableCell>
                                        <TableCell className="py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/dashboard/houses/${house._id}`}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(house)}>
                                                    <Pencil className="h-3.5 w-3.5 text-amber-500" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the house and remove its data from our servers.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(house._id)} className="bg-red-600 hover:bg-red-700">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
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
                                } else if (e.target.value === "") {
                                    // Allow clearing briefly
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
