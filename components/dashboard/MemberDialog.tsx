"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form" // Assuming react-hook-form/zod if available, or just state for now to match current style
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ArrowRight, User, Users, Heart, Baby } from "lucide-react"
import { toast } from "sonner"
import { createMember, updateMember, getMembers, getHouses } from "@/lib/api"
import { useParams } from "next/navigation" // Added import

interface MemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultFamilyId?: string
    defaultHouseId?: string
    onSuccess?: () => void
    memberToEdit?: any // Optional member object for editing
}

export function MemberDialog({ open, onOpenChange, defaultFamilyId, defaultHouseId, onSuccess, memberToEdit }: MemberDialogProps) {
    const { id } = useParams()
    const familyId = defaultFamilyId || id as string

    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [existingMembers, setExistingMembers] = useState<any[]>([]) // Renamed back to existingMembers to match usage
    const [houses, setHouses] = useState<any[]>([]) // Only needed if houseId not provided

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        gender: "Male",
        dateOfBirth: "",
        mobile: "",
        occupation: "",
        maritalStatus: "Single",
        bloodGroup: "",
        houseId: "none", // Default to none, will be set by defaultHouseId or memberToEdit
        familyId: "" // Will be set by defaultFamilyId or useParams
    })

    // Relationship State
    const [relationships, setRelationships] = useState({
        fatherId: "none",
        motherId: "none",
        spouseId: "none",
        siblingId: "none" // Helper to auto-fill parents
    })

    // Fetch context data when opened
    useEffect(() => {
        if (open) {
            setStep(1)

            if (memberToEdit) {
                // Pre-fill for editing
                setFormData({
                    name: memberToEdit.name || "",
                    gender: memberToEdit.gender || "Male",
                    dateOfBirth: memberToEdit.dateOfBirth ? new Date(memberToEdit.dateOfBirth).toISOString().split('T')[0] : "",
                    mobile: memberToEdit.mobile || "",
                    occupation: memberToEdit.occupation || "",
                    maritalStatus: memberToEdit.maritalStatus || "Single",
                    bloodGroup: memberToEdit.bloodGroup || "",
                    houseId: memberToEdit.house ? memberToEdit.house._id : "none",
                    familyId: familyId
                })
                // Relationships? Editing relationships is complex because it requires loading logic.
                // For now allow basic detail editing.
            } else {
                // Reset for new member
                setFormData({
                    name: "",
                    gender: "Male",
                    dateOfBirth: "",
                    mobile: "",
                    occupation: "",
                    maritalStatus: "Single",
                    bloodGroup: "",
                    houseId: defaultHouseId || "none",
                    familyId: familyId
                })
                setRelationships({ fatherId: "none", motherId: "none", spouseId: "none", siblingId: "none" })
            }

            // Fetch houses for selection
            getHouses({ family: familyId }).then((res: any) => {
                const list = Array.isArray(res) ? res : (res.houses || [])
                setHouses(list)
            }).catch(console.error)

            // If House ID is set (from edit or default), load members for relationships
            const targetHouseId = memberToEdit?.house?._id || defaultHouseId
            if (targetHouseId && targetHouseId !== 'none') {
                fetchHouseMembers(targetHouseId)
            }
        }
    }, [open, defaultFamilyId, defaultHouseId, memberToEdit, familyId]) // Added familyId to dependencies

    const fetchHouseMembers = async (houseId: string) => {
        try {
            const data = await getMembers({ house: houseId })
            setExistingMembers(Array.isArray(data) ? data : data.members || [])
        } catch (error) {
            console.error(error)
        }
    }

    // Handle initial detail submission
    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.dateOfBirth || !formData.bloodGroup) {
            toast.error("Name, Date of Birth, and Blood Group are required")
            return
        }

        // Logic check: If house is selected (and valid), we go to step 2 to define relationships.
        // If "Independent" or no house, we submit immediately or skip relationships.
        if (formData.houseId && formData.houseId !== 'none') {
            // Need to make sure we have members loaded if house was selected manually
            if (!defaultHouseId) {
                await fetchHouseMembers(formData.houseId)
            }

            // If there are existing members, go to Step 2. Else submit as Head.
            // Using a timeout to ensure state update if we just fetched? No, await above is fine.
            // Actually, we need to check the *current* fetch result. 
            // Only issue is existingMembers state might be stale if we just fetched. 
            // Let's rely on Step 2 rendering logic: if (existingMembers.length > 0)

            // We'll set step 2 regardless, and let the view decide if it auto-submits or shows empty "No relations available" msg?
            // Better: Check length directly after fetch if manual

            setStep(2)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const parents = []
            if (relationships.fatherId !== 'none') parents.push(relationships.fatherId)
            if (relationships.motherId !== 'none') parents.push(relationships.motherId)

            const payload = {
                ...formData,
                spouse: relationships.spouseId !== 'none' ? relationships.spouseId : undefined,
                parents: parents.length > 0 ? parents : undefined,
                houseId: formData.houseId === 'none' ? undefined : formData.houseId
            }

            if (memberToEdit) {
                await updateMember(memberToEdit._id, payload)
                toast.success("Member updated successfully")
            } else {
                await createMember(payload)
                toast.success("Member added successfully")
            }

            onOpenChange(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save member")
        } finally {
            setLoading(false)
        }
    }

    // Computed Lists for Selects
    const males = existingMembers.filter(m => m.gender === 'Male')
    const females = existingMembers.filter(m => m.gender === 'Female')
    const others = existingMembers.filter(m => m) // For spouse, anyone really, but usually opposite gender logic applies if strict

    // Step 2 UI is only relevant if there are members
    const showRelationships = existingMembers.length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md md:max-w-xl overflow-hidden p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50/50 dark:bg-neutral-900/50">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {step === 1 ? <User className="h-5 w-5 text-blue-500" /> : <Users className="h-5 w-5 text-purple-500" />}
                        {step === 1 ? "New Member Details" : "Family Connections"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 ? "Enter personal information." : `How is ${formData.name} related to the household?`}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    {step === 1 ? (
                        <form id="step1-form" onSubmit={handleNext} className="space-y-4">
                            {/* House Selection (Only if not provided AND not editing) */}
                            {(!defaultHouseId && !memberToEdit) && (
                                <div className="space-y-2">
                                    <Label>House Assignment</Label>
                                    <Select
                                        value={formData.houseId}
                                        onValueChange={(val) => setFormData({ ...formData, houseId: val })}
                                    >
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select House" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Independent (No House)</SelectItem>
                                            {houses.map(h => (
                                                <SelectItem key={h._id} value={h._id}>{h.name} ({h.customId})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={val => setFormData({ ...formData, gender: val })}
                                    >
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.dateOfBirth}
                                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Marital Status</Label>
                                    <Select
                                        value={formData.maritalStatus}
                                        onValueChange={val => setFormData({ ...formData, maritalStatus: val })}
                                    >
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                            <SelectItem value="Divorced">Divorced</SelectItem>
                                            <SelectItem value="Widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Blood Group <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.bloodGroup}
                                        onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                                    >
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                            <SelectItem value="Unknown">Unknown</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile</Label>
                                    <Input
                                        value={formData.mobile}
                                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                        placeholder="050..."
                                    />
                                </div>
                            </div>
                        </form>
                    ) : (
                        <>
                            {!showRelationships ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <p>This is the first member of the house.</p>
                                    <p className="text-sm">They will be considered the <strong>Head of House</strong>.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Tabs defaultValue="child" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="child">Child</TabsTrigger>
                                            <TabsTrigger value="spouse">Spouse</TabsTrigger>
                                            <TabsTrigger value="sibling">Sibling</TabsTrigger>
                                        </TabsList>

                                        <div className="pt-4 px-1 min-h-[200px]">
                                            <TabsContent value="child" className="mt-0 space-y-4">
                                                <p className="text-xs text-muted-foreground">Select parents within the house.</p>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label className="text-right">Father</Label>
                                                        <Select
                                                            value={relationships.fatherId}
                                                            onValueChange={val => setRelationships({ ...relationships, fatherId: val })}
                                                        >
                                                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Father" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Unknown / Not in House</SelectItem>
                                                                {males.map(m => (
                                                                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label className="text-right">Mother</Label>
                                                        <Select
                                                            value={relationships.motherId}
                                                            onValueChange={val => setRelationships({ ...relationships, motherId: val })}
                                                        >
                                                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Mother" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Unknown / Not in House</SelectItem>
                                                                {females.map(m => (
                                                                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="spouse" className="mt-0 space-y-4">
                                                <p className="text-xs text-muted-foreground">
                                                    {formData.gender === 'Male'
                                                        ? "Adding a Son-in-Law? Select his Wife."
                                                        : "Adding a Daughter-in-Law? Select her Husband."}
                                                </p>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right">
                                                        {formData.gender === 'Male' ? 'Wife' : 'Husband'}
                                                    </Label>
                                                    <Select
                                                        value={relationships.spouseId}
                                                        onValueChange={val => setRelationships({ ...relationships, spouseId: val, fatherId: 'none', motherId: 'none' })} // Creating In-law implies no parents in house roughly
                                                    >
                                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Partner" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Not Applicable</SelectItem>
                                                            {existingMembers
                                                                .filter(m => m.gender !== formData.gender) // Strict opposite gender for spouse
                                                                .map(m => (
                                                                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="sibling" className="mt-0 space-y-4">
                                                <p className="text-xs text-muted-foreground">Select a brother/sister to copy parent details.</p>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right">Sibling</Label>
                                                    <Select
                                                        value={relationships.siblingId}
                                                        onValueChange={(val) => {
                                                            const sibling = existingMembers.find(m => m._id === val)
                                                            let newRels = { ...relationships, siblingId: val }

                                                            if (sibling && sibling.parents && sibling.parents.length > 0) {
                                                                const p1 = existingMembers.find(m => m._id === sibling.parents[0]) || existingMembers.find(m => m._id === sibling.parents[0]?._id)
                                                                const p2 = existingMembers.find(m => m._id === sibling.parents[1]) || existingMembers.find(m => m._id === sibling.parents[1]?._id)

                                                                if (p1) {
                                                                    if (p1.gender === 'Male') newRels.fatherId = p1._id
                                                                    else if (p1.gender === 'Female') newRels.motherId = p1._id
                                                                }
                                                                if (p2) {
                                                                    if (p2.gender === 'Male') newRels.fatherId = p2._id
                                                                    else if (p2.gender === 'Female') newRels.motherId = p2._id
                                                                }
                                                                toast.success(`Auto-filled parents from ${sibling.name}`)
                                                            } else if (val !== 'none') {
                                                                toast.info("Selected sibling has no linked parents.")
                                                            }
                                                            setRelationships(newRels)
                                                        }}
                                                    >
                                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Sibling" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {existingMembers.filter(m => m._id !== relationships.spouseId).map(m => ( // Don't show spouse as sibling
                                                                <SelectItem key={m._id} value={m._id}>{m.name} ({m.gender})</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {/* Preview Parents if filled */}
                                                {(relationships.fatherId !== 'none' || relationships.motherId !== 'none') && (
                                                    <div className="rounded bg-slate-100 dark:bg-neutral-800 p-3 text-xs space-y-1">
                                                        <p className="font-semibold">Linked Parents:</p>
                                                        {relationships.fatherId !== 'none' && <div>Father: {existingMembers.find(m => m._id === relationships.fatherId)?.name}</div>}
                                                        {relationships.motherId !== 'none' && <div>Mother: {existingMembers.find(m => m._id === relationships.motherId)?.name}</div>}
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 dark:bg-neutral-900/50 flex justify-between sm:justify-between items-center">
                    {step === 2 ? (
                        <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step === 1 ? (
                        <Button type="submit" form="step1-form">
                            {(!formData.houseId || formData.houseId === 'none') || (houses.length === 0 && !defaultHouseId) ? "Finish" : "Next: Relationships"}
                            {/* Simplistic logic label, refined inside handler */}
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finish & Add Member
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

import { Loader2 } from "lucide-react"
