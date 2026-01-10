"use client"
import { useEffect, useState, useCallback } from "react"
import { getHouse, getMembers, deleteMember, createMember, updateMember, updateHouse } from "@/lib/api"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Trash2, Home, User, AlignJustify, Network, MapPin, Plus, Pencil, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "@/components/ui/alert-dialog"
import { MemberDialog } from "@/components/dashboard/MemberDialog"
import { MemberDetailsDialog } from "@/components/dashboard/MemberDetailsDialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Imports (Ensure MemberNode is part of the file imports, adding it here if needed or assuming it's imported)
import MemberNode from '@/components/dashboard/MemberNode';

// Node Types Registry
const nodeTypes = {
    member: MemberNode,
};

// Layout Graph Function
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Increased size for Card Nodes
    const nodeWidth = 220;
    const nodeHeight = 120; // Approx height of card

    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 50, // Horizontal separation
        ranksep: 100, // Vertical separation (Generations)
    });

    nodes.forEach((node) => {
        // Special size for small marriage nodes
        if (node.id.startsWith('marriage')) {
            dagreGraph.setNode(node.id, { width: 20, height: 20 });
        } else if (node.id === 'root') {
            dagreGraph.setNode(node.id, { width: 200, height: 60 });
        } else {
            dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        }
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Center alignment adjustments based on actual node size
        let w = nodeWidth;
        let h = nodeHeight;

        if (node.id.startsWith('marriage')) { w = 20; h = 20; }
        if (node.id === 'root') { w = 200; h = 60; }

        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
                x: nodeWithPosition.x - w / 2,
                y: nodeWithPosition.y - h / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

// ... (HouseDetailPage component starts) ...
// INSIDE Component, around line 450 (VisualTree definition)



// ... (Data Fetching Logic Update to use 'member' type) ...
// I will need another replace call to update the data transformation loop. 
// This chunk focuses on layout and component registration.

export default function HouseDetailPage() {
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [house, setHouse] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

    // Visual Tree State
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const [editingMember, setEditingMember] = useState<any>(null)
    const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Details View State
    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)



    const fetchData = useCallback(async () => {
        try {
            const [houseData, membersData] = await Promise.all([
                getHouse(id as string),
                getMembers({ house: id })
            ])
            if (!houseData) {
                throw new Error("House not found");
            }
            setHouse(houseData)

            // Handle pagination wrapper if present
            const membersList = Array.isArray(membersData) ? membersData : (membersData.members || [])
            setMembers(membersList)

            // --- Build Graph ---
            const newNodes: any[] = []
            const newEdges: any[] = []

            // 1. House Node (Always Root)
            newNodes.push({
                id: 'root',
                data: { label: `${houseData.name} (${houseData.customId})` },
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

            // 2. Member Nodes (Children of House)
            membersList.forEach((member: any) => {
                const headId = houseData.head ? (typeof houseData.head === 'string' ? houseData.head : houseData.head._id) : null;
                const isHead = headId === member._id;
                const isResident = member.relationshipToHead === 'Resident';

                // Determine Spouse status relation
                let isSpouse = false;
                if (member.spouse) isSpouse = true;

                newNodes.push({
                    id: member._id,
                    type: 'member', // Use Custom Node
                    data: {
                        label: member.name,
                        subLabel: isHead ? 'Head' : member.relationshipToHead,
                        gender: member.gender,
                        dateOfBirth: member.dateOfBirth,
                        isHead: isHead,
                        isResident: isResident,
                        isSpouse: isSpouse
                    },
                    position: { x: 0, y: 0 },
                    // Inline style removed - handled by component
                    style: { width: 220, height: 120 } // Used by Dagre layout
                })



                // Edge: House -> Member (Structural Root Link)
                const parentId = 'root'; // In single house view, they belong to the house (root)

                // Edge Loop
            })

            // --- Post-Process House Connections ---
            const rootMembers = membersList.filter((m: any) => {
                const hasParents = m.parents && m.parents.length > 0 && m.parents.some((p: any) => membersList.find((existing: any) => existing._id === (typeof p === 'string' ? p : p._id)));
                return !hasParents;
            });

            const processedRoots = new Set<string>();
            const sortedRoots = [...rootMembers].sort((a: any, b: any) => a._id.localeCompare(b._id));

            // Prioritize Explicit Head from House Data
            const explicitHeadId = houseData.head ? (typeof houseData.head === 'string' ? houseData.head : houseData.head._id) : null;
            let headAssigned = false;

            // Pass 1: Explicit Head
            if (explicitHeadId) {
                const member = membersList.find((m: any) => m._id === explicitHeadId);
                if (member) {
                    newEdges.push({
                        id: `e-root-${member._id}`,
                        source: 'root',
                        target: member._id,
                        type: 'smoothstep',
                        style: { stroke: '#eab308', strokeWidth: 2 },
                        label: 'Head of House',
                        labelStyle: { fill: '#b45309', fontWeight: 700, fontSize: 10 },
                        labelBgStyle: { fill: '#fffbeb' }
                    });
                    processedRoots.add(member._id);
                    headAssigned = true;
                    if (member.spouse) {
                        const spouseId = typeof member.spouse === 'string' ? member.spouse : member.spouse._id;
                        processedRoots.add(spouseId);
                    }
                }
            }

            // Pass 2: Remaining Roots
            sortedRoots.forEach((member: any) => {
                if (processedRoots.has(member._id)) return;

                const parentId = 'root';
                let shouldAnchor = true;
                if (member.spouse) {
                    const spouseId = typeof member.spouse === 'string' ? member.spouse : member.spouse._id;
                    if (processedRoots.has(spouseId)) {
                        shouldAnchor = false;
                    }
                }

                if (shouldAnchor) {
                    processedRoots.add(member._id);

                    let isHead = false;
                    // Fallback Head if not assigned
                    if (!headAssigned) {
                        isHead = true;
                        headAssigned = true;
                    }

                    if (isHead) {
                        newEdges.push({
                            id: `e-${parentId}-${member._id}`,
                            source: parentId,
                            target: member._id,
                            type: 'smoothstep',
                            style: { stroke: '#eab308', strokeWidth: 2 },
                            label: 'Head of House',
                            labelStyle: { fill: '#b45309', fontWeight: 700, fontSize: 10 },
                            labelBgStyle: { fill: '#fffbeb' }
                        })
                    } else {
                        // Resident
                        newEdges.push({
                            id: `e-${parentId}-${member._id}`,
                            source: parentId,
                            target: member._id,
                            type: 'smoothstep',
                            style: { stroke: '#cbd5e1', strokeDasharray: '5,5' },
                            label: 'Resident',
                            labelStyle: { fill: '#94a3b8', fontSize: 9 },
                            labelBgStyle: { fill: '#f8fafc' }
                        })
                    }
                }
            })


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
                        const marriageNodeId = `marriage-${coupleId}`

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
                        })

                        // Edges from Spouses to Marriage Node
                        newEdges.push({
                            id: `e-${member._id}-${marriageNodeId}`,
                            source: member._id,
                            target: marriageNodeId,
                            type: 'smoothstep',
                            style: { stroke: '#ec4899', strokeWidth: 1.5 },
                            label: member.gender === 'Male' ? 'Husband' : 'Wife',
                            labelStyle: { fill: '#ec4899', fontSize: 9 }
                        })
                        newEdges.push({
                            id: `e-${sid}-${marriageNodeId}`,
                            source: sid,
                            target: marriageNodeId,
                            type: 'smoothstep',
                            style: { stroke: '#ec4899', strokeWidth: 1.5 },
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
                        const marriageNodeId = `marriage-${coupleId}`
                        // Check if this marriage node exists
                        if (newNodes.find(n => n.id === marriageNodeId)) {
                            // Connect Marriage Node -> Child
                            newEdges.push({
                                id: `e-${marriageNodeId}-${member._id}`,
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

                    // If not connected via marriage node
                    if (!connectedToMarriage) {
                        member.parents.forEach((p: any) => {
                            const pid = typeof p === 'string' ? p : p._id
                            if (membersList.find((m: any) => m._id === pid)) {
                                newEdges.push({
                                    id: `e-parent-${pid}-${member._id}`,
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
            toast.error("Failed to load house details")
        } finally {
            setLoading(false)
        }
    }, [id, setNodes, setEdges])

    useEffect(() => {
        if (id) fetchData()
    }, [id, fetchData])

    const confirmDeleteMember = (memberId: string) => {
        setDeletingMemberId(memberId)
        setIsDeleteDialogOpen(true)
    }

    const handleSetHead = async (memberId: string) => {
        try {
            await updateHouse(id as string, { head: memberId })
            toast.success("Head of House updated")
            fetchData()
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to update Head of House")
        }
    }

    const handleDeleteMember = async () => {
        if (!deletingMemberId) return
        try {
            await deleteMember(deletingMemberId)
            toast.success("Member deleted successfully")
            fetchData()
            setIsDeleteDialogOpen(false)
            setDeletingMemberId(null)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete member")
        }
    }

    const MembersList = () => (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 border-b bg-slate-50/80 dark:bg-neutral-800/50 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-500" /> Residents ({members.length})
                </h3>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                    setEditingMember(null)
                    setIsAddMemberOpen(true)
                }}>
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>
            <ScrollArea className="flex-1 h-full w-full">
                <div className="p-2 space-y-1">
                    {members.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-4 text-center italic">No residents in this house.</div>
                    ) : (
                        members.map(member => {
                            const isHead = house?.head === member._id || house?.head?._id === member._id;

                            return (
                                <div key={member._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-xs group">
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isHead ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-600"
                                        }`}>
                                        {isHead ? <Crown className="h-3 w-3" /> : member.name.charAt(0)}
                                    </div>
                                    <span className="truncate flex-1">{member.name}</span>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        {!isHead && (
                                            <Button size="icon" variant="ghost" className="h-5 w-5" title="Make Head of House"
                                                onClick={() => handleSetHead(member._id)}>
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
                                        <Button size="icon" variant="ghost" className="h-5 w-5"
                                            onClick={() => confirmDeleteMember(member._id)}>
                                            <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    )

    const onNodeClick = (_: any, node: any) => {
        if (node.type === 'member') {
            const member = members.find(m => m._id === node.id)
            if (member) {
                setSelectedMember(member)
                setIsDetailsOpen(true)
            }
        }
    }

    const VisualTree = () => (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-right"
        >
            <Controls className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 shadow-sm" />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        </ReactFlow>
    )

    const InfoSection = () => (
        <div className="p-3 border-b bg-white dark:bg-neutral-900 flex flex-col gap-3 shrink-0">
            <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Address</span>
                <div className="flex items-start gap-1.5 text-xs text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                    <span>{house?.address || "No address provided"}</span>
                </div>
            </div>
            <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Family Link</span>
                {house?.family ? (
                    <div className="text-xs">
                        <Link href={`/dashboard/families/${house.family._id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            {house.family.name} Family <ArrowLeft className="h-3 w-3 rotate-180" />
                        </Link>
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground italic">Independent House</div>
                )}
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-black/10">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-900 border-b shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/houses">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-neutral-800">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Home className="h-4 w-4 text-blue-500" />
                            {house?.name}
                        </h1>
                        <p className="text-xs text-muted-foreground font-mono">{house?.customId}</p>
                    </div>
                </div>
            </header>

            {/* Desktop View: Grid Layout */}
            <div className="hidden lg:grid flex-1 w-full overflow-hidden grid-cols-4 h-full">
                {/* Left Sidebar */}
                <div className="col-span-1 border-r bg-white dark:bg-neutral-900 flex flex-col h-full overflow-hidden">
                    <InfoSection />
                    <MembersList />
                </div>
                {/* Right Pane: Visual Tree */}
                <div className="col-span-3 h-full relative bg-slate-50/50 dark:bg-black/20">
                    <VisualTree />
                </div>
            </div>

            {/* Mobile View: Tabs Layout */}
            <div className="lg:hidden flex-1 w-full overflow-hidden flex flex-col">
                <Tabs defaultValue="overview" className="flex-1 flex flex-col h-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-background px-4 h-12">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <AlignJustify className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="tree" className="flex items-center gap-2">
                            <Network className="h-4 w-4" /> Visual Tree
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="flex-1 flex flex-col overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden">
                        <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
                            <InfoSection />
                            <MembersList />
                        </div>
                    </TabsContent>

                    <TabsContent value="tree" className="flex-1 overflow-hidden m-0 p-0 h-full data-[state=inactive]:hidden relative bg-slate-50/50">
                        <VisualTree />
                    </TabsContent>
                </Tabs>
            </div>

            <MemberDialog
                open={isAddMemberOpen}
                onOpenChange={setIsAddMemberOpen}
                defaultHouseId={id as string}
                onSuccess={() => { fetchData() }}
                memberToEdit={editingMember}
            />

            <MemberDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                member={selectedMember}
                onEdit={(member) => {
                    setIsDetailsOpen(false)
                    setEditingMember(member)
                    setIsAddMemberOpen(true)
                }}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the member.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMember} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
