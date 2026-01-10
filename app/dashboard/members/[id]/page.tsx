"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { getMember } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HouseCollectionTab } from "@/components/dashboard/HouseCollectionTab"
import { ArrowLeft, Loader2, LayoutGrid, Coins, User, Calendar, Phone, Heart, Briefcase, GraduationCap, Building, MapPin, Crown, Pencil } from "lucide-react"
import { toast } from "sonner"
import { MemberDialog } from "@/components/dashboard/MemberDialog"

export default function MemberDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [member, setMember] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const fetchMember = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getMember(id as string)
            setMember(data)
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch member details")
            router.push('/dashboard/families') // Fallback
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (id) {
            fetchMember()
        }
    }, [id, fetchMember])

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const calculateAge = (dob: string) => {
        if (!dob) return ""
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return `${age} years`
    }

    const Field = ({ icon: Icon, label, value, className }: any) => (
        <div className={`p-2 rounded-md border bg-card text-card-foreground ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-sm font-medium pl-5">{value || <span className="text-muted-foreground italic">N/A</span>}</div>
        </div>
    )

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    if (!member) return null

    return (
        <div className="h-full flex flex-col bg-muted/40 group/page">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2 bg-background border-b shrink-0 h-12">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border 
                            ${member.relationshipToHead === 'Head' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                (member.gender === 'Female' ? "bg-pink-100 text-pink-600 border-pink-200" : "bg-blue-100 text-blue-600 border-blue-200")}`}>
                            {member.relationshipToHead === 'Head' ? <Crown className="h-4 w-4" /> : member.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold flex items-center gap-2 leading-none">
                                {member.name}
                                <span className="text-xs font-normal text-muted-foreground">({member.customId})</span>
                            </h1>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground leading-none mt-1">
                                <span className="capitalize">Resident</span> of {" "}
                                <span className="font-medium hover:underline cursor-pointer text-foreground" onClick={() => router.push(`/dashboard/houses/${member.house?._id}`)}>
                                    {member.house?.name || "Unknown House"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-2" onClick={() => setIsEditOpen(true)}>
                        <Pencil className="h-3 w-3" /> Edit
                    </Button>
                </div>
            </header>

            {/* Content using Tabs */}
            <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="profile" className="h-full flex flex-col">
                    <div className="px-4 border-b bg-background/50">
                        <TabsList className="h-9 w-auto bg-transparent p-0 gap-4">
                            <TabsTrigger
                                value="profile"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 py-1 h-full text-xs"
                            >
                                Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="collections"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-2 py-1 h-full text-xs"
                            >
                                Collections
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="profile" className="flex-1 m-0 h-full overflow-hidden bg-muted/20">
                        <ScrollArea className="h-full">
                            <div className="p-4 max-w-5xl mx-auto space-y-4 pb-10">
                                {/* Personal Info */}
                                <Card className="shadow-sm border-border/60">
                                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                            Personal Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <Field icon={Calendar} label="Date of Birth" value={`${formatDate(member.dateOfBirth)} (${calculateAge(member.dateOfBirth)})`} />
                                        <Field icon={Heart} label="Marital Status" value={member.maritalStatus} />
                                        <Field icon={Heart} label="Blood Group" value={member.bloodGroup} className="text-red-700 dark:text-red-400" />
                                        <Field icon={User} label="Gender" value={member.gender} />
                                        <Field icon={Briefcase} label="Occupation" value={member.occupation} />
                                        <Field icon={GraduationCap} label="Education" value={member.education} />
                                        <Field icon={Building} label="Madrassa" value={member.madrassa} />
                                    </CardContent>
                                </Card>

                                {/* Contact Info */}
                                <Card className="shadow-sm border-border/60">
                                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                            Contact & Location
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <Field icon={Phone} label="Mobile" value={member.mobile} />
                                        <Field icon={Phone} label="WhatsApp" value={member.whatsapp} />
                                        <Field icon={MapPin} label="Current Place" value={member.place} />
                                    </CardContent>
                                </Card>

                                {/* ID Cards */}
                                <Card className="shadow-sm border-border/60">
                                    <CardHeader className="py-3 px-4 border-b bg-muted/20">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                            Documents
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(member.idCards || {}).map(([key, value]) => (
                                                (value as boolean) && (
                                                    <Badge key={key} variant="outline" className="capitalize px-3 py-1 font-normal bg-background/50">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </Badge>
                                                )
                                            ))}
                                            {!Object.values(member.idCards || {}).some(v => Boolean(v)) && <span className="text-xs text-muted-foreground italic">No ID cards recorded</span>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="collections" className="flex-1 m-0 h-full overflow-hidden">
                        <div className="h-full bg-background">
                            <HouseCollectionTab
                                type="member"
                                entityId={member._id}
                                entityName={member.name}
                                currentSubscription={member.subscription}
                                onUpdate={fetchMember}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Edit Dialog - Reusing MemberDialog logic */}
            <MemberDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                memberToEdit={member}
                defaultFamilyId={member.family?._id}
                defaultHouseId={member.house?._id}
                onSuccess={() => {
                    fetchMember()
                    setIsEditOpen(false)
                }}
            />
        </div>
    )
}
