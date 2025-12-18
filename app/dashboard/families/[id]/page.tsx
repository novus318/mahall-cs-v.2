"use client"
// Imports
import { useEffect, useState, useCallback, useMemo } from "react"
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, MarkerType, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { getFamily, getHouses, getMembers, createHouse, createMember, updateHouse } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, ArrowLeft, Home, Users, AlignJustify, Network, Pencil, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { MemberDialog } from "@/components/dashboard/MemberDialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

// --- Visual Tree Layout Logic ---
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Optimized spacing for Family Tree clarity
    const nodeWidth = 180;
    const nodeHeight = 50;

    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 60, // Increased from 30 to separate siblings/spouses better
        ranksep: 80, // Increased from 50 to separate generations clearly
        edgesep: 20  // Prevent edge overlap
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const isRoot = node.id === 'root';
        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

export default function FamilyDetailDashboard() {
    const { id } = useParams()
    const router = useRouter()

    // Data State
    const [loading, setLoading] = useState(true)
    const [family, setFamily] = useState<any>(null)
    const [houses, setHouses] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])

    // Visual Tree State
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

    // Dialog States
    const [isAddHouseOpen, setIsAddHouseOpen] = useState(false)
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [selectedHouseIdForAdd, setSelectedHouseIdForAdd] = useState<string | undefined>(undefined) // Track which house triggered add

    // State for Edits (Moved UP)
    const [editingMember, setEditingMember] = useState<any>(null)
    const [editingHouse, setEditingHouse] = useState<any>(null)
    const [isEditHouseOpen, setIsEditHouseOpen] = useState(false)

    // Forms State
    const [houseForm, setHouseForm] = useState({ name: "", address: "" })



    const fetchData = useCallback(async () => {
        try {
            const [famData, housesData, membersData] = await Promise.all([
                getFamily(id as string),
                getHouses({ family: id }),
                getMembers({ family: id })
            ])
            setFamily(famData)

            // Handle potentially paginated responses
            const housesList = Array.isArray(housesData) ? housesData : (housesData.houses || [])
            const membersList = Array.isArray(membersData) ? membersData : (membersData.members || [])

            setHouses(housesList)
            setMembers(membersList)

            // --- Build Graph ---
            const newNodes: any[] = []
            const newEdges: any[] = []

            // Root Node
            newNodes.push({
                id: 'root',
                data: { label: `${famData.name} (${famData.customId})` },
                position: { x: 0, y: 0 },
                style: {
                    background: '#0f172a',
                    color: '#fff',
                    border: '1px solid #1e293b',
                    width: 180,
                    borderRadius: 8,
                    padding: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }
            })

            // Houses
            housesList.forEach((house: any) => {
                newNodes.push({
                    id: house._id,
                    data: { label: house.name },
                    position: { x: 0, y: 0 },
                    style: {
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        width: 160,
                        borderRadius: 6,
                        padding: '6px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500'
                    }
                })
                newEdges.push({
                    id: `e - root - ${house._id} `,
                    source: 'root',
                    target: house._id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#94a3b8' }
                })
            })

            // Members
            membersList.forEach((member: any) => {
                const parentId = member.house ? member.house._id : 'root';
                newNodes.push({
                    id: member._id,
                    data: { label: member.name }, // Simple label for compact view
                    position: { x: 0, y: 0 },
                    style: {
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        width: 140,
                        borderRadius: 20,
                        padding: '4px',
                        fontSize: '11px',
                        textAlign: 'center'
                    }
                })

                // Edge: House -> Member (Structural Layout)
                // New Logic to strictly enforce ONE Head of House (the first created/oldest).
                // 1. Collect all "Root" candidates (Members with NO parents in house).

                const hasParentsInHouse = member.parents && member.parents.length > 0 && member.parents.some((p: any) => membersList.find((m: any) => m._id === (typeof p === 'string' ? p : p._id)));

                let isRoot = !hasParentsInHouse;

                // If member works for the house connection?
                // If married, we only want ONE of them to be the anchor candidate to avoid double checking.
                // Let's rely on the "Husband" or "First Created" rule later.
                // Actually, simplest is: Treat EVERY root as a candidate anchor, but then group them?
                // No, just collect all roots.

                // WAIT: We need to do this OUTSIDE the loop if we want to sort globally.
                // BUT, inside this loop we are processing "member".
                // Better strategy:
                // Just add them to a list "houseConnectionCandidates" and process edges AFTER this loop.
            })

            // --- Post-Process House Connections ---
            // New Strategy:
            // 1. Connect Explicit Heads first (Primary Anchor). They get "Head of House" edge.
            // 2. Connect remaining Roots (Residents). They get "Resident" edge.

            const processedAnchors = new Set<string>();
            const headsAssignedByParent = new Set<string>();

            // Pass 1: Explicit Heads
            housesList.forEach((house: any) => {
                if (house.head) {
                    const headId = typeof house.head === 'string' ? house.head : house.head._id;
                    const member = membersList.find((m: any) => m._id === headId);
                    if (member) {
                        const parentId = house._id;
                        newEdges.push({
                            id: `e-${parentId}-${member._id}`,
                            source: parentId,
                            target: member._id,
                            type: 'smoothstep',
                            style: { stroke: '#64748b', strokeWidth: 1.5 },
                            label: 'Head of House',
                            labelStyle: { fill: '#64748b', fontWeight: 700, fontSize: 10 },
                            labelBgStyle: { fill: '#f1f5f9' }
                        });
                        processedAnchors.add(member._id);
                        headsAssignedByParent.add(parentId);

                        if (member.spouse) {
                            const spouseId = typeof member.spouse === 'string' ? member.spouse : member.spouse._id;
                            processedAnchors.add(spouseId); // Mark spouse as handled to avoid double connection
                        }
                    }
                }
            });

            // Pass 2: Remaining Roots (Residents)
            // Roots are members with NO parents in house.
            const rootMembers = membersList.filter((m: any) => {
                const hasParents = m.parents && m.parents.length > 0 && m.parents.some((p: any) => membersList.find((existing: any) => existing._id === (typeof p === 'string' ? p : p._id)));
                return !hasParents;
            });
            const sortedRoots = [...rootMembers].sort((a: any, b: any) => a._id.localeCompare(b._id));

            sortedRoots.forEach((member: any) => {
                // Check if already processed (either as Head or as Spouse of Head)
                if (processedAnchors.has(member._id)) return;

                // Check spouse
                if (member.spouse) {
                    const spouseId = typeof member.spouse === 'string' ? member.spouse : member.spouse._id;
                    if (processedAnchors.has(spouseId)) return; // Spouse handled
                }

                const parentId = member.house ? member.house._id : 'root';
                const houseHasHead = headsAssignedByParent.has(parentId);

                // If house has a Head assigned (from Pass 1), this root is a Resident.
                // If NOT, then this is the "First Created" fallback logic.

                let label = 'Resident';
                let style = { stroke: '#e2e8f0', strokeDasharray: '5,5' };
                let labelColor = '#94a3b8';

                if (!houseHasHead) {
                    // Fallback: This is the first root, make them Head (heuristic)
                    label = 'Head of House';
                    style = { stroke: '#64748b', strokeWidth: 1.5 } as any; // Cast to avoid TS strictness on strokeDasharray mismatch types
                    labelColor = '#64748b';

                    // Mark house as having head now
                    headsAssignedByParent.add(parentId);
                }

                newEdges.push({
                    id: `e-${parentId}-${member._id}`,
                    source: parentId,
                    target: member._id,
                    type: 'smoothstep',
                    style: style,
                    label: label,
                    labelStyle: { fill: labelColor, fontSize: 9 },
                    labelBgStyle: { fill: '#f8fafc' }
                });

                processedAnchors.add(member._id);
                if (member.spouse) {
                    const spouseId = typeof member.spouse === 'string' ? member.spouse : member.spouse._id;
                    processedAnchors.add(spouseId);
                }
            });
            // End of House Connection Logic

            // Track processed marriages to avoid duplicates
            const processedMarriages = new Set<string>();

            // 1. Process Marriages first to create Marriage Nodes
            membersList.forEach((member: any) => {
                if (member.spouse) {
                    const sid = typeof member.spouse === 'string' ? member.spouse : member.spouse._id
                    // Ensure we only process each couple once (use sorted IDs key)
                    const coupleId = [member._id, sid].sort().join('-')

                    if (!processedMarriages.has(coupleId) && membersList.find((m: any) => m._id === sid)) {
                        processedMarriages.add(coupleId)
                        const marriageNodeId = `marriage - ${coupleId} `

                        // Add Marriage Node (Invisible or small dot)
                        newNodes.push({
                            id: marriageNodeId,
                            data: { label: '' },
                            position: { x: 0, y: 0 },
                            style: {
                                width: 10,
                                height: 10,
                                background: '#ec4899',
                                borderRadius: '50%',
                                border: 'none'
                            },
                            // We don't want to show this node prominently, just a junction
                        })

                        // Edges from Spouses to Marriage Node
                        // Husband -> Node
                        newEdges.push({
                            id: `e - ${member._id} -${marriageNodeId} `,
                            source: member._id,
                            target: marriageNodeId,
                            type: 'smoothstep',
                            style: { stroke: '#ec4899', strokeWidth: 1.5 },
                            label: member.gender === 'Male' ? 'Husband' : 'Wife',
                            labelStyle: { fill: '#ec4899', fontSize: 9 }
                        })
                        // Wife -> Node
                        newEdges.push({
                            id: `e - ${sid} -${marriageNodeId} `,
                            source: sid,
                            target: marriageNodeId,
                            type: 'smoothstep',
                            style: { stroke: '#ec4899', strokeWidth: 1.5 },
                            // Determine label for the other spouse
                            label: membersList.find((m: any) => m._id === sid)?.gender === 'Male' ? 'Husband' : 'Wife',
                            labelStyle: { fill: '#ec4899', fontSize: 9 }
                        })
                    }
                }
            })

            // Second Pass: Connect Children to Marriage Nodes or Single Parents
            membersList.forEach((member: any) => {
                if (member.parents && member.parents.length > 0) {
                    // Check if parents are a couple
                    const p1 = member.parents[0]
                    const p2 = member.parents[1]
                    const p1Id = typeof p1 === 'string' ? p1 : p1?._id
                    const p2Id = typeof p2 === 'string' ? p2 : p2?._id

                    let connectedToMarriage = false

                    if (p1Id && p2Id) {
                        const coupleId = [p1Id, p2Id].sort().join('-')
                        const marriageNodeId = `marriage - ${coupleId} `
                        // Check if this marriage node exists (i.e. both parents are in the graph and linked)
                        if (newNodes.find(n => n.id === marriageNodeId)) {
                            // Connect Marriage Node -> Child
                            newEdges.push({
                                id: `e - ${marriageNodeId} -${member._id} `,
                                source: marriageNodeId,
                                target: member._id,
                                type: 'smoothstep',
                                style: { stroke: '#3b82f6', strokeWidth: 1.5 },
                                label: member.gender === 'Male' ? 'Son' : 'Daughter',
                                labelStyle: { fill: '#3b82f6', fontSize: 9, fontWeight: 600 }
                            })
                            connectedToMarriage = true
                        }
                    }

                    // If not connected via marriage node (e.g. single parent or parents not linked as spouse), connect directly
                    if (!connectedToMarriage) {
                        member.parents.forEach((p: any) => {
                            const pid = typeof p === 'string' ? p : p._id
                            if (membersList.find((m: any) => m._id === pid)) {
                                newEdges.push({
                                    id: `e - parent - ${pid} -${member._id} `,
                                    source: pid,
                                    target: member._id,
                                    type: 'smoothstep',
                                    style: { stroke: '#3b82f6', strokeWidth: 1.5 },
                                    label: member.gender === 'Male' ? 'Son' : 'Daughter',
                                    labelStyle: { fill: '#3b82f6', fontSize: 9 }
                                })
                            }
                        })
                    }
                }
            })

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
            setNodes(layoutedNodes)
            setEdges(layoutedEdges)

        } catch (error) {
            console.error(error)
            toast.error("Failed to load family data")
        } finally {
            setLoading(false)
        }
    }, [id, setNodes, setEdges])

    useEffect(() => {
        if (id) fetchData()
    }, [id, fetchData])

    // -- Handlers --
    const handleCreateHouse = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createHouse({
                ...houseForm,
                familyId: id // Pre-filled
            })
            toast.success("House created successfully")
            setIsAddHouseOpen(false)
            setHouseForm({ name: "", address: "" })
            fetchData() // Refresh
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create house")
        }
    }



    // Handlers (Moved UP)
    const handleSetHeadOfHouse = async (houseId: string, memberId: string) => {
        try {
            await updateHouse(houseId, { head: memberId })
            toast.success("Head of House updated")
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to set Head of House")
        }
    }

    const handleUpdateHouse = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingHouse) return
        try {
            await updateHouse(editingHouse._id, {
                name: houseForm.name,
                address: houseForm.address
            })
            toast.success("House updated")
            setIsEditHouseOpen(false)
            setEditingHouse(null)
            fetchData()
        } catch (error: any) {
            toast.error("Failed to update house")
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    if (!family) return <div className="p-8 text-center">Family not found</div>

    // --- Sub-Components (Avoids duplication) ---

    // Unified Directory with Accordion
    const FamilyDirectory = () => {
        // Group members by house
        const membersByHouse: Record<string, any[]> = {}
        const independentMembers: any[] = []

        members.forEach(m => {
            if (m.house && m.house._id) {
                if (!membersByHouse[m.house._id]) membersByHouse[m.house._id] = []
                membersByHouse[m.house._id].push(m)
            } else {
                independentMembers.push(m)
            }
        })

        return (
            <div className="flex-1 flex flex-col min-h-0 border-b overflow-hidden">
                <div className="p-3 border-b bg-slate-50/80 dark:bg-neutral-800/50 flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Home className="h-3.5 w-3.5 text-slate-500" /> Structure ({houses.length} Houses)
                    </h3>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                        setHouseForm({ name: "", address: "" })
                        setEditingHouse(null)
                        setIsAddHouseOpen(true)
                    }}>
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <ScrollArea className="flex-1 h-full w-full">
                    <div className="p-2 pb-20"> {/* pb for scroll space */}
                        <Accordion type="multiple" className="w-full space-y-2">
                            {houses.map(house => {
                                const houseMembers = membersByHouse[house._id] || []
                                return (
                                    <AccordionItem key={house._id} value={house._id} className="border rounded-md px-2 bg-white dark:bg-neutral-900">
                                        <div className="flex items-center justify-between py-2 group">
                                            <AccordionTrigger className="py-0 hover:no-underline flex-1 text-sm font-medium">
                                                <div className="flex flex-col items-start text-left">
                                                    <span>{house.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">{houseMembers.length} Members</span>
                                                </div>
                                            </AccordionTrigger>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm" variant="ghost" className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingHouse(house)
                                                        setHouseForm({ name: house.name, address: house.address || "" })
                                                        setIsEditHouseOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="h-3 w-3 text-slate-500" />
                                                </Button>
                                                <Button
                                                    size="sm" variant="ghost" className="h-6 w-6 ml-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedHouseIdForAdd(house._id)
                                                        setEditingMember(null)
                                                        setIsAddMemberOpen(true)
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3 text-blue-500" />
                                                </Button>
                                            </div>
                                        </div>
                                        <AccordionContent className="pt-2 pb-2 border-t mt-1">
                                            {houseMembers.length === 0 ? (
                                                <div className="text-xs text-muted-foreground italic pl-2">No members.</div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {houseMembers.map(member => {
                                                        const isHead = house.head === member._id || (!house.head && houseMembers[0]?._id === member._id);

                                                        return (
                                                            <div key={member._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-xs group">
                                                                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", isHead ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-600")}>
                                                                    {isHead ? <Crown className="h-3 w-3" /> : member.name.charAt(0)}
                                                                </div>
                                                                <span className="truncate flex-1">{member.name}</span>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                                    {!isHead && (
                                                                        <Button size="icon" variant="ghost" className="h-5 w-5" title="Make Head of House"
                                                                            onClick={() => handleSetHeadOfHouse(house._id, member._id)}>
                                                                            <Crown className="h-3 w-3 text-slate-400 hover:text-yellow-600" />
                                                                        </Button>
                                                                    )}
                                                                    <Button size="icon" variant="ghost" className="h-5 w-5"
                                                                        onClick={() => {
                                                                            setEditingMember(member)
                                                                            setIsAddMemberOpen(true)
                                                                        }}>
                                                                        <Pencil className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}

                            {/* Independent Members Section */}
                            {independentMembers.length > 0 && (
                                <AccordionItem value="independent" className="border rounded-md px-2 bg-slate-50 dark:bg-neutral-800/50">
                                    <div className="flex items-center justify-between py-2">
                                        <AccordionTrigger className="py-0 hover:no-underline flex-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                                            <div className="flex flex-col items-start text-left">
                                                <span>Independent Members</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">{independentMembers.length} Members</span>
                                            </div>
                                        </AccordionTrigger>
                                        <Button
                                            size="sm" variant="ghost" className="h-7 w-7 ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedHouseIdForAdd("none")
                                                setEditingMember(null)
                                                setIsAddMemberOpen(true)
                                            }}
                                        >
                                            <Plus className="h-3.5 w-3.5 text-slate-500" />
                                        </Button>
                                    </div>
                                    <AccordionContent className="pt-2 pb-2 border-t mt-1">
                                        <div className="space-y-1">
                                            {independentMembers.map(member => (
                                                <div key={member._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors text-xs group">
                                                    <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <span className="truncate flex-1">{member.name}</span>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                                        onClick={() => {
                                                            setEditingMember(member)
                                                            setIsAddMemberOpen(true)
                                                        }}>
                                                        <Pencil className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                    </div>
                </ScrollArea>
            </div>
        )
    }

    const VisualTree = () => (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-right"
        >
            <Controls className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 shadow-sm" />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
        </ReactFlow>
    )

    const HouseDialog = () => (
        <Dialog open={isAddHouseOpen || isEditHouseOpen} onOpenChange={(val) => {
            setIsAddHouseOpen(val)
            setIsEditHouseOpen(val)
            if (!val) {
                setEditingHouse(null)
                setHouseForm({ name: "", address: "" })
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingHouse ? "Edit House" : "Add House"}</DialogTitle>
                    <DialogDescription>{editingHouse ? "Update details" : `Add a new house to ${family?.name} `}</DialogDescription>
                </DialogHeader>
                <form onSubmit={editingHouse ? handleUpdateHouse : handleCreateHouse} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>House Name</Label>
                        <Input
                            placeholder="e.g. Block A-101"
                            value={houseForm.name}
                            onChange={(e) => setHouseForm({ ...houseForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                            placeholder="Physical address..."
                            value={houseForm.address}
                            onChange={(e) => setHouseForm({ ...houseForm, address: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">{editingHouse ? "Update" : "Create"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-black/10">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-900 border-b shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/families">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-neutral-800">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            {family?.name}
                        </h1>
                        <p className="text-xs text-muted-foreground font-mono transition-all">{family?.customId}</p>
                    </div>
                </div>
            </header>

            {/* Desktop View: Grid Layout (Hidden on Mobile) */}
            <div className="hidden lg:grid flex-1 w-full overflow-hidden grid-cols-4 h-full">
                {/* Left Sidebar */}
                <div className="col-span-1 border-r bg-white dark:bg-neutral-900 flex flex-col h-full overflow-hidden">
                    <FamilyDirectory />
                </div>
                {/* Right Pane: Visual Tree */}
                <div className="col-span-3 h-full relative bg-slate-50/50 dark:bg-black/20">
                    <VisualTree />
                </div>
            </div>

            {/* Mobile View: Tabs Layout (Hidden on Desktop) */}
            <div className="lg:hidden flex-1 w-full overflow-hidden flex flex-col">
                <Tabs defaultValue="overview" className="flex-1 flex flex-col h-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-background px-4 h-12">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <AlignJustify className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="tree" className="flex items-center gap-2">
                            <Network className="h-4 w-4" /> Family Tree
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="flex-1 flex flex-col overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden">
                        <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
                            <FamilyDirectory />
                        </div>
                    </TabsContent>

                    <TabsContent value="tree" className="flex-1 overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden relative bg-slate-50/50">
                        <VisualTree />
                    </TabsContent>
                </Tabs>
            </div>

            <HouseDialog />
            <MemberDialog
                open={isAddMemberOpen}
                onOpenChange={(val) => {
                    setIsAddMemberOpen(val)
                    if (!val) {
                        setSelectedHouseIdForAdd(undefined) // Reset selection
                        setEditingMember(null)
                    }
                }}
                defaultFamilyId={id as string}
                defaultHouseId={selectedHouseIdForAdd}
                memberToEdit={editingMember}
                onSuccess={() => { fetchData() }}
            />
        </div>
    )
}
