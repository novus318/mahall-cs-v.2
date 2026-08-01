"use client"
import { useEffect, useState } from "react"
import { getFamilies, getHouses, createMember } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddMemberPage() {
    const router = useRouter()
    const [families, setFamilies] = useState([])
    const [houses, setHouses] = useState([])
    const [filteredHouses, setFilteredHouses] = useState([])

    const [selectedFamily, setSelectedFamily] = useState<string>("")
    const [selectedHouse, setSelectedHouse] = useState<string>("")

    const [formData, setFormData] = useState({
        name: "",
        gender: "Male",
        dateOfBirth: "",
        mobile: "",
        whatsapp: "",
        bloodGroup: "",
        education: "",
        occupation: "",
        maritalStatus: "Single",
    })

    // Fetch Logic
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [famData, houseData] = await Promise.all([getFamilies(), getHouses()])
                setFamilies(famData)
                setHouses(houseData)
            } catch (error) {
                toast.error("Failed to load dependency data")
            }
        }
        fetchData()
    }, [])

    // Filter Houses when Family changes
    useEffect(() => {
        if (selectedFamily === "independent") {
            setFilteredHouses(houses.filter((h: any) => !h.family))
        } else if (selectedFamily) {
            setFilteredHouses(houses.filter((h: any) => h.family?._id === selectedFamily))
        } else {
            setFilteredHouses([])
        }
        setSelectedHouse("") // Reset house selection
    }, [selectedFamily, houses])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedHouse) {
            toast.error("Please select a house")
            return
        }

        try {
            const payload = {
                ...formData,
                houseId: selectedHouse,
                // Add other fields logic later (parents etc)
            }
            await createMember(payload)
            toast.success("Member added successfully")
            router.push("/dashboard/members")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create member")
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-8 md:p-8 bg-muted/40 min-h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/members">
                    <Button variant="ghost" size="icon" className="hover:bg-muted/50"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Management · Members
                    </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Add New Member</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Quickly add a member to a family and house.</p>
                </div>
            </div>

            <Card className="bg-card shadow-sm">
                <CardHeader className="border-b bg-muted/40">
                    <CardTitle className="text-base font-semibold">Member Details</CardTitle>
                    <CardDescription className="text-xs">Enter the personal details of the new member.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Step 1: Location Context */}
                        <div className="space-y-4 rounded-lg bg-muted/40 p-4 border">
                            <h3 className="font-semibold mb-2">1. Family & House</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Select Family</Label>
                                    <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose Family..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="independent">-- Independent --</SelectItem>
                                            {families.map((f: any) => (
                                                <SelectItem key={f._id} value={f._id}>{f.name} ({f.customId})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Select House</Label>
                                    <Select value={selectedHouse} onValueChange={setSelectedHouse} disabled={!selectedFamily}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!selectedFamily ? "Select Family First" : "Choose House..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredHouses.length === 0 ? (
                                                <SelectItem value="none" disabled>No houses found</SelectItem>
                                            ) : (
                                                filteredHouses.map((h: any) => (
                                                    <SelectItem key={h._id} value={h._id}>{h.name} ({h.customId})</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Personal Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold mb-2">2. Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Member Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Blood Group</Label>
                                    <Select value={formData.bloodGroup} onValueChange={(val) => handleSelectChange("bloodGroup", val)}>
                                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Marital Status</Label>
                                    <Select value={formData.maritalStatus} onValueChange={(val) => handleSelectChange("maritalStatus", val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                            <SelectItem value="Divorced">Divorced</SelectItem>
                                            <SelectItem value="Widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Occupation</Label>
                                    <Input name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Job Title / Student" />
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Contact Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold mb-2">3. Contact Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Mobile Number</Label>
                                    <Input name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="10-digit number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp (Optional)</Label>
                                    <Input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="If different" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg">Add Member</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
