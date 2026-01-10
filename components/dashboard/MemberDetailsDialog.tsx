"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, User, Calendar, Phone, Briefcase, Heart, MapPin, Mail, GraduationCap, Building, Coins, LayoutGrid } from "lucide-react"
import { HouseCollectionTab } from "@/components/dashboard/HouseCollectionTab"

interface MemberDetailsDialogProps {
    member: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (member: any) => void
    onUpdate?: () => void
}

export function MemberDetailsDialog({ member, open, onOpenChange, onEdit, onUpdate }: MemberDetailsDialogProps) {
    if (!member) return null

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
        <div className={`flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-neutral-900/50 ${className}`}>
            <Icon className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className="text-sm font-medium text-foreground">{value || "N/A"}</span>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4 border-b bg-white dark:bg-neutral-900 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm border-4 border-white dark:border-neutral-800 ${member.relationshipToHead === 'Head' ? "bg-yellow-100 text-yellow-700" : (member.gender === 'Female' ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600")
                                }`}>
                                {member.relationshipToHead === 'Head' ? <Crown className="h-8 w-8" /> : member.name.charAt(0)}
                            </div>
                            <div className="flex flex-col mt-1">
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    {member.name}
                                    {member.gender === 'Female' ? <User className="h-5 w-5 text-pink-400" /> : <User className="h-5 w-5 text-blue-400" />}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1.5">
                                    <Badge variant="secondary" className="font-normal">
                                        {member.relationshipToHead}
                                    </Badge>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-sm">{member.customId}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        {onEdit && (
                            <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 px-6 h-12">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="collections" className="flex items-center gap-2">
                            <Coins className="h-4 w-4" /> Collections
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="flex-1 overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden">
                        <ScrollArea className="flex-1 h-full">
                            <div className="p-6 grid gap-6">
                                {/* Section: Personal Info */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <User className="h-4 w-4" /> Personal Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Field icon={Calendar} label="Date of Birth" value={`${formatDate(member.dateOfBirth)} (${calculateAge(member.dateOfBirth)})`} />
                                        <Field icon={Heart} label="Marital Status" value={member.maritalStatus} />
                                        <Field icon={Heart} label="Blood Group" value={member.bloodGroup} className="text-red-600" />
                                        <Field icon={Briefcase} label="Occupation" value={member.occupation} />
                                        <Field icon={GraduationCap} label="Education" value={member.education} />
                                        <Field icon={Building} label="Madrassa" value={member.madrassa} />
                                    </div>
                                </div>

                                {/* Section: Contact */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <Phone className="h-4 w-4" /> Contact & Location
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Field icon={Phone} label="Mobile" value={member.mobile} />
                                        <Field icon={Phone} label="WhatsApp" value={member.whatsapp} />
                                        <Field icon={MapPin} label="Current Place" value={member.place} />
                                    </div>
                                </div>

                                {/* Section: ID Cards */}
                                <div className="space-y-3 hidden md:block">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <Briefcase className="h-4 w-4" /> Identification
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(member.idCards || {}).map(([key, value]) => (
                                            (value as boolean) && (
                                                <Badge key={key} variant="outline" className="capitalize bg-slate-50 dark:bg-neutral-800 border-slate-200">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </Badge>
                                            )
                                        ))}
                                        {!Object.values(member.idCards || {}).some(v => Boolean(v)) && <span className="text-sm text-muted-foreground italic">No ID cards recorded</span>}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="collections" className="flex-1 overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden">
                        <HouseCollectionTab
                            type="member"
                            entityId={member._id}
                            entityName={member.name}
                            currentSubscription={member.subscription}
                            onUpdate={onUpdate || (() => { })}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
