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
import { ArrowLeft, ArrowRight, User, Users, Heart, Baby, Briefcase, Loader2, Check, XCircle } from "lucide-react"
import { toast } from "sonner"
import { createMember, updateMember, getMembers, getHouses } from "@/lib/api"
import { useParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

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

    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [loading, setLoading] = useState(false)
    const [existingMembers, setExistingMembers] = useState<any[]>([])
    const [houses, setHouses] = useState<any[]>([])
    const [houseOpen, setHouseOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        gender: "Male",
        dateOfBirth: "",
        mobile: "",
        whatsapp: "",
        occupation: "",
        maritalStatus: "Single",
        bloodGroup: "",
        houseId: "none",
        familyId: "",
        education: "Below 10",
        madrassa: "Below 5",
        madrassaOther: "", // For custom input
        place: "",
        idCards: {
            aadhaar: false,
            drivingLicense: false,
            voterId: false,
            panCard: false,
            healthCard: false
        }
    })

    // New Relationship Logic State
    const [relationshipData, setRelationshipData] = useState({
        relatedMemberId: "none",
        relationshipType: "" // 'Wife', 'Son', 'Daughter', 'Brother', 'Sister', 'Resident', etc.
    })

    const [houseSearchCode, setHouseSearchCode] = useState("")
    const [houseValidationStatus, setHouseValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
    const [validatedHouseName, setValidatedHouseName] = useState("")

    const validateHouseCode = async (code: string) => {
        if (!code) {
            setHouseValidationStatus('idle')
            setValidatedHouseName("")
            setFormData(prev => ({ ...prev, houseId: "none" }))
            return
        }

        setHouseValidationStatus('validating')
        try {
            const res: any = await getHouses({ search: code, limit: 10 })
            const list = Array.isArray(res) ? res : (res.houses || [])
            // Find Exact Match on Custom ID
            const match = list.find((h: any) => h.customId.toLowerCase() === code.toLowerCase())

            if (match) {
                setHouseValidationStatus('valid')
                setValidatedHouseName(match.name)
                setFormData(prev => ({ ...prev, houseId: match._id }))
                // Optionally fetch members here if needed for relationship logic
                fetchHouseMembers(match._id)
            } else {
                setHouseValidationStatus('invalid')
                setValidatedHouseName("")
                setFormData(prev => ({ ...prev, houseId: "none" }))
            }
        } catch (error) {
            console.error(error)
            setHouseValidationStatus('invalid')
        }
    }

    // Helper to Get Available Relationships based on Gender
    const getAvailableRelationships = () => {
        if (relationshipData.relatedMemberId === 'none') return ['Head', 'Resident']; // No relation selected

        const relatedMember = existingMembers.find(m => m._id === relationshipData.relatedMemberId);
        if (!relatedMember) return [];

        const myGender = formData.gender;
        const relatedGender = relatedMember.gender;

        const options = [];

        // Spouse Logic
        if (myGender !== relatedGender) {
            options.push(myGender === 'Male' ? 'Husband' : 'Wife');
        }

        // Child Logic (I am their child)
        options.push(myGender === 'Male' ? 'Son' : 'Daughter');

        // Sibling Logic (I am their sibling)
        options.push(myGender === 'Male' ? 'Brother' : 'Sister');

        // Parent Logic (I am their parent)
        options.push(myGender === 'Male' ? 'Father' : 'Mother');

        // Other
        options.push('Resident'); // No family relation but in same house

        return options;
    }

    // Fetch context data when opened
    useEffect(() => {
        if (open) {
            setStep(1)
            setRelationshipData({ relatedMemberId: "none", relationshipType: "" })

            if (memberToEdit) {
                // Pre-fill for editing
                setFormData({
                    name: memberToEdit.name || "",
                    gender: memberToEdit.gender || "Male",
                    dateOfBirth: memberToEdit.dateOfBirth ? new Date(memberToEdit.dateOfBirth).toISOString().split('T')[0] : "",
                    mobile: memberToEdit.mobile || "",
                    whatsapp: memberToEdit.whatsapp || "", // Added fix
                    occupation: memberToEdit.occupation || "",
                    maritalStatus: memberToEdit.maritalStatus || "Single",
                    bloodGroup: memberToEdit.bloodGroup || "",
                    houseId: memberToEdit.house ? memberToEdit.house._id : "none",
                    familyId: familyId,
                    education: memberToEdit.education || "Below 10",
                    madrassa: ["Below 5", "Below 10", "11", "12"].includes(memberToEdit.madrassa) ? memberToEdit.madrassa : "Other",
                    madrassaOther: ["Below 5", "Below 10", "11", "12"].includes(memberToEdit.madrassa) ? "" : memberToEdit.madrassa || "",
                    place: memberToEdit.place || "",
                    idCards: {
                        aadhaar: memberToEdit.idCards?.aadhaar || false,
                        drivingLicense: memberToEdit.idCards?.drivingLicense || false,
                        voterId: memberToEdit.idCards?.voterId || false,
                        panCard: memberToEdit.idCards?.panCard || false,
                        healthCard: memberToEdit.idCards?.healthCard || false
                    }
                })
            } else {
                // Reset for new member
                setFormData({
                    name: "",
                    gender: "Male",
                    dateOfBirth: "",
                    mobile: "",
                    whatsapp: "",
                    occupation: "",
                    maritalStatus: "Single",
                    bloodGroup: "",
                    houseId: defaultHouseId || "none",
                    familyId: familyId,
                    education: "Below 10",
                    madrassa: "Below 5",
                    madrassaOther: "",
                    place: "",
                    idCards: {
                        aadhaar: false,
                        drivingLicense: false,
                        voterId: false,
                        panCard: false,
                        healthCard: false
                    }
                })
            }

            // Fetch houses
            // Fetch houses
            getHouses({ family: familyId, limit: 1000 }).then((res: any) => {
                const list = Array.isArray(res) ? res : (res.houses || [])
                setHouses(list)
            }).catch(console.error)

            // If House ID is set, load members
            const targetHouseId = memberToEdit?.house?._id || defaultHouseId
            if (targetHouseId && targetHouseId !== 'none') {
                if (memberToEdit && memberToEdit.house) {
                    setHouseSearchCode(memberToEdit.house.customId || "")
                    setValidatedHouseName(memberToEdit.house.name || "")
                    setHouseValidationStatus('valid')
                }
                fetchHouseMembers(targetHouseId)
            }
        }
    }, [open, defaultFamilyId, defaultHouseId, memberToEdit, familyId])

    const fetchHouseMembers = async (houseId: string) => {
        try {
            const data = await getMembers({ house: houseId })
            setExistingMembers(Array.isArray(data) ? data : data.members || [])
        } catch (error) {
            console.error(error)
        }
    }

    const handleNextStep1 = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.dateOfBirth) {
            toast.error("Name and Date of Birth are required")
            return
        }

        if (formData.houseId && formData.houseId !== 'none') {
            if (formData.houseId !== defaultHouseId?.toString() && !memberToEdit) {
                await fetchHouseMembers(formData.houseId)
            }
        }

        setStep(2)
    }

    const handleNextStep2 = (e: React.FormEvent) => {
        e.preventDefault()
        // If no members in house or independent, skip relationship step?
        // Actually, if house is selected and has members, enable step 3.
        // If independent, or no members, we can allow Submit here or show summary?
        // For consistency, let's check house members.

        if (formData.houseId !== 'none' && existingMembers.length > 0) {
            setStep(3)
        } else {
            // Skip step 3 if no one to relate to
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // payloads
            const { madrassaOther, ...rest } = formData
            const payload = {
                ...rest,
                madrassa: formData.madrassa === 'Other' ? formData.madrassaOther : formData.madrassa,
                relatedMemberId: relationshipData.relatedMemberId !== 'none' ? relationshipData.relatedMemberId : undefined,
                relationshipType: relationshipData.relationshipType || (existingMembers.length === 0 ? 'Head' : 'Resident')
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md md:max-w-xl overflow-hidden p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50/50 dark:bg-neutral-900/50">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {step === 1 ? <User className="h-5 w-5 text-blue-500" /> : step === 2 ? <Briefcase className="h-5 w-5 text-green-500" /> : <Users className="h-5 w-5 text-purple-500" />}
                        {step === 1 ? (memberToEdit ? "Edit Profile" : "New Member") : step === 2 ? "Additional Details" : "Family Connection"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 ? "Basic personal information." : step === 2 ? "Education, Occupation & IDs." : `How is ${formData.name} related to the household?`}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    {step === 1 && (
                        <form id="step1-form" onSubmit={handleNextStep1} className="space-y-4">
                            {(!defaultHouseId && !memberToEdit) && (
                                <div className="space-y-2">
                                    <Label>House ID</Label>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Input
                                                placeholder="Enter House ID (e.g. H-101)..."
                                                value={houseSearchCode}
                                                onChange={(e) => setHouseSearchCode(e.target.value)}
                                                onBlur={(e) => validateHouseCode(e.target.value)}
                                                className={houseValidationStatus === 'invalid' ? "border-red-500 pr-10" : "pr-10"}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {houseValidationStatus === 'validating' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                                {houseValidationStatus === 'valid' && <Check className="h-4 w-4 text-green-500" />}
                                                {houseValidationStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-500" />}
                                            </div>
                                        </div>
                                    </div>
                                    {houseValidationStatus === 'valid' && (
                                        <p className="text-sm text-green-600 font-medium mt-1">
                                            ✓ Found: {validatedHouseName}
                                        </p>
                                    )}
                                    {houseValidationStatus === 'invalid' && (
                                        <p className="text-sm text-red-500 mt-1">
                                            House not found.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Full Name <span className="text-red-500">*</span></Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender <span className="text-red-500">*</span></Label>
                                    <Select value={formData.gender} onValueChange={val => setFormData({ ...formData, gender: val })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input type="date" required value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Marital Status</Label>
                                    <Select value={formData.maritalStatus} onValueChange={val => setFormData({ ...formData, maritalStatus: val })}>
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
                                    <Label>Blood Group</Label>
                                    <Select value={formData.bloodGroup} onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (<SelectItem key={bg} value={bg}>{bg}</SelectItem>))}
                                            <SelectItem value="Unknown">Unknown</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile</Label>
                                    <Input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="050..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp</Label>
                                    <Input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="Same as mobile..." />
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form id="step2-form" onSubmit={handleNextStep2} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Education</Label>
                                    <Select value={formData.education} onValueChange={(val) => setFormData({ ...formData, education: val })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Below 10", "SSLC", "Pre-Degree", "Bachelors", "Diploma", "Masters", "Other"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Madrassa</Label>
                                    <Select value={formData.madrassa} onValueChange={(val) => setFormData({ ...formData, madrassa: val })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Below 5", "Below 10", "11", "12", "Other"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {formData.madrassa === 'Other' && (
                                        <Input
                                            placeholder="Specify Madrassa..."
                                            value={formData.madrassaOther}
                                            onChange={e => setFormData({ ...formData, madrassaOther: e.target.value })}
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Occupation</Label>
                                    <Input value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} placeholder="Job title..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Place</Label>
                                    <Input value={formData.place} onChange={e => setFormData({ ...formData, place: e.target.value })} placeholder="City / Location" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Identification Cards</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border p-3 rounded-md bg-slate-50/50 dark:bg-neutral-900/50">
                                    {Object.entries(formData.idCards).map(([key, checked]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`id-${key}`}
                                                checked={checked}
                                                onCheckedChange={(c) => setFormData({
                                                    ...formData,
                                                    idCards: { ...formData.idCards, [key]: c === true }
                                                })}
                                            />
                                            <Label htmlFor={`id-${key}`} className="capitalize cursor-pointer text-sm font-normal">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {existingMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                                        <span className="text-2xl">👑</span>
                                    </div>
                                    <h3 className="font-semibold text-lg">First Member</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        This is the first member of the house. They will be automatically assigned as the <strong>Head of House</strong>.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>1. Select Related Member</Label>
                                            <Select
                                                value={relationshipData.relatedMemberId}
                                                onValueChange={(val) => setRelationshipData({ relatedMemberId: val, relationshipType: "" })}
                                            >
                                                <SelectTrigger className="w-full h-11">
                                                    <SelectValue placeholder="Choose a member..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">-- No Relation / Resident --</SelectItem>
                                                    {existingMembers.map(m => (
                                                        <SelectItem key={m._id} value={m._id}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{m.name}</span>
                                                                <span className="text-xs text-muted-foreground">({m.relationshipToHead || 'Member'})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {relationshipData.relatedMemberId !== 'none' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <Label>2. How is <strong>{formData.name}</strong> related to them?</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {getAvailableRelationships().map(rel => (
                                                        <div
                                                            key={rel}
                                                            onClick={() => setRelationshipData({ ...relationshipData, relationshipType: rel })}
                                                            className={`cursor-pointer border rounded-md p-3 flex items-center justify-center text-sm font-medium transition-all
                                                                ${relationshipData.relationshipType === rel
                                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
                                                                    : 'hover:bg-slate-50 border-slate-200 dark:border-neutral-800 dark:hover:bg-neutral-800'
                                                                }`}
                                                        >
                                                            {rel}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {relationshipData.relatedMemberId === 'none' && (
                                            <div className="rounded-md bg-slate-50 p-4 text-sm text-muted-foreground italic border border-dashed text-center">
                                                Member will be added as a generic <strong>Resident</strong> without specific family links.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 dark:bg-neutral-900/50 flex justify-between sm:justify-between items-center">
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => setStep(step - 1 as any)} disabled={loading}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step === 1 && (
                        <Button type="submit" form="step1-form">
                            Next: Details <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}

                    {step === 2 && (
                        <Button type="submit" form="step2-form">
                            {formData.houseId !== 'none' && existingMembers.length > 0 ? (
                                <>Next: Relations <ArrowRight className="h-4 w-4 ml-2" /></>
                            ) : (
                                <>Confirm & Add</>
                            )}
                        </Button>
                    )}

                    {step === 3 && (
                        <Button onClick={handleSubmit} disabled={loading || (existingMembers.length > 0 && relationshipData.relatedMemberId !== 'none' && !relationshipData.relationshipType)}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Add
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


