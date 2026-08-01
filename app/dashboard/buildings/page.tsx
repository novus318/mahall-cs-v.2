'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Building2, MapPin, Search, Home, Loader2, MoreHorizontal, Settings2, Trash2, Edit2, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import api from '@/lib/axios';

// --- Types ---
type Room = {
    _id: string;
    roomNumber: string;
    status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
    currentContract?: any;
};

type Building = {
    _id: string;
    buildingId: string;
    name: string;
    place: string;
    rooms: Room[];
};

// --- Schemas ---
const buildingSchema = z.object({
    buildingId: z.string().min(2, "ID required").toUpperCase(), // Used only for create
    name: z.string().min(2, "Name required"),
    place: z.string().min(2, "Place required"),
});

const roomSchema = z.object({
    roomNumber: z.string().min(1, "Room/Shop No. required"),
    // Status removed for creation
});

export default function BuildingsPage() {
    // Data
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(false);

    // Selection & UI State
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialogs
    const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
    const [isEditBuildingOpen, setIsEditBuildingOpen] = useState(false);
    const [isManageRoomsOpen, setIsManageRoomsOpen] = useState(false);
    const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // Forms
    const buildingForm = useForm<z.infer<typeof buildingSchema>>({
        resolver: zodResolver(buildingSchema),
        defaultValues: { buildingId: '', name: '', place: '' }
    });

    const roomForm = useForm<z.infer<typeof roomSchema>>({
        resolver: zodResolver(roomSchema),
        defaultValues: { roomNumber: '' }
    });

    const editRoomForm = useForm<z.infer<typeof roomSchema>>({
        resolver: zodResolver(roomSchema),
        defaultValues: { roomNumber: '' }
    });

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/buildings');
            setBuildings(data);
        } catch (error) { toast.error("Failed to fetch buildings"); }
        finally { setLoading(false); }
    };

    const fetchRooms = async (buildingId: string) => {
        setRoomsLoading(true);
        try {
            const { data } = await api.get(`/buildings/${buildingId}/rooms`);
            setRooms(data);
        } catch (error) { toast.error("Failed to fetch rooms"); }
        finally { setRoomsLoading(false); }
    };

    // --- Building Actions ---
    const onAddBuilding = async (values: z.infer<typeof buildingSchema>) => {
        try {
            await api.post('/buildings', values);
            toast.success("Building created");
            setIsAddBuildingOpen(false);
            buildingForm.reset();
            fetchBuildings();
        } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
    };

    const onEditBuilding = async (values: z.infer<typeof buildingSchema>) => {
        // ID not editable usually, but simplified schema re-use
        // We only send name and place
        if (!selectedBuilding) return;
        try {
            await api.put(`/buildings/${selectedBuilding._id}`, { name: values.name, place: values.place });
            toast.success("Building updated");
            setIsEditBuildingOpen(false);
            fetchBuildings();
        } catch (error: any) { toast.error("Failed to update"); }
    };

    const onDeleteBuilding = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this building and all its units? This cannot be undone.")) return;
        try {
            await api.delete(`/buildings/${id}`);
            toast.success("Deleted");
            fetchBuildings();
        } catch (error) { toast.error("Failed to delete"); }
    };

    // --- Room Actions ---
    const openManageRooms = (building: Building) => {
        setSelectedBuilding(building);
        setRooms([]);
        fetchRooms(building._id);
        setIsManageRoomsOpen(true);
    };

    const onAddRoom = async (values: z.infer<typeof roomSchema>) => {
        if (!selectedBuilding) return;
        try {
            await api.post(`/buildings/${selectedBuilding._id}/rooms`, values);
            toast.success("Room added");
            roomForm.reset();
            await fetchRooms(selectedBuilding._id);
            fetchBuildings(); // Update counts
        } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
    };

    const onEditRoom = async (values: z.infer<typeof roomSchema>) => {
        if (!selectedRoom) return;
        try {
            await api.put(`/buildings/rooms/${selectedRoom._id}`, values);
            toast.success("Room updated");
            setIsEditRoomOpen(false);
            if (selectedBuilding) fetchRooms(selectedBuilding._id);
        } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
    };

    const onDeleteRoom = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/buildings/rooms/${id}`);
            toast.success("Room deleted");
            if (selectedBuilding) {
                await fetchRooms(selectedBuilding._id);
                fetchBuildings(); // Update count
            }
        } catch (error: any) { toast.error(error.response?.data?.message || "Failed"); }
    };

    // Helpers
    const filteredBuildings = buildings.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.buildingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.place.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)] overflow-hidden bg-muted/40">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <div className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">Management · Buildings</div>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">Buildings</h2>
                    <p className="text-muted-foreground text-sm mt-1">Manage buildings and units.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => { buildingForm.reset({ buildingId: '', name: '', place: '' }); setIsAddBuildingOpen(true); }} size="sm" className="h-8">
                        <Plus className="mr-2 h-3.5 w-3.5" /> New Building
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 -mx-4 px-4">
                {/* Search */}
                <div className="relative max-w-sm mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
                    {loading ? <div className="col-span-full h-40 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> :
                        filteredBuildings.map((building) => (
                            <Card key={building._id} className="group hover:shadow-md transition-all border-border">
                                <CardHeader className="p-4 pb-2 bg-muted/40 border-b flex flex-row items-start justify-between space-y-0">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-sm font-semibold">{building.name}</CardTitle>
                                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-4 bg-background">{building.buildingId}</Badge>
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1"><MapPin className="mr-1 h-3 w-3" />{building.place}</div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => { setSelectedBuilding(building); buildingForm.reset(building); setIsEditBuildingOpen(true); }} className="text-xs">
                                                <Edit2 className="mr-2 h-3 w-3" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => onDeleteBuilding(building._id, e)} className="text-xs text-destructive focus:text-destructive">
                                                <Trash className="mr-2 h-3 w-3" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground font-medium">TOTAL UNITS</div>
                                    <div className="text-xl font-bold font-mono text-foreground">{building.rooms?.length || 0}</div>
                                </CardContent>
                                <CardFooter className="p-2 border-t bg-muted/40">
                                    <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => openManageRooms(building)}>
                                        Manage Units
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                </div>
            </ScrollArea>

            {/* Manage Rooms Sheet */}
            <Sheet open={isManageRoomsOpen} onOpenChange={setIsManageRoomsOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[500px] flex flex-col gap-0 p-0 shadow-2xl border-l">
                    <div className="p-4 border-b bg-muted/40 backdrop-blur-sm sticky top-0 z-10">
                        <SheetTitle className="text-base font-bold flex items-center justify-between">
                            <span>{selectedBuilding?.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">{selectedBuilding?.buildingId}</span>
                        </SheetTitle>
                        <SheetDescription className="text-xs">Manage units for this building.</SheetDescription>

                        {/* Simplified Add Room */}
                        <div className="mt-4 p-3 bg-background border rounded-lg shadow-sm">
                            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Plus className="h-3 w-3" /> Add Unit</h4>
                            <Form {...roomForm}>
                                <form onSubmit={roomForm.handleSubmit(onAddRoom)} className="flex items-center gap-2">
                                    <FormField control={roomForm.control} name="roomNumber" render={({ field }) => (
                                        <FormItem className="flex-1 space-y-0">
                                            <FormControl><Input placeholder="Unit / Shop Number" className="h-8 text-xs" {...field} /></FormControl>
                                            <FormMessage className="text-[10px] mt-1 absolute" />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" size="sm" className="h-8 px-4 bg-primary text-primary-foreground">Add</Button>
                                </form>
                            </Form>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 bg-muted/40">
                        <div className="p-4 grid grid-cols-2 gap-3 pb-8">
                            {roomsLoading ? <div className="col-span-full h-20 flex justify-center items-center"><Loader2 className="h-5 w-5 animate-spin" /></div> :
                                rooms.map((room) => (
                                    <div key={room._id} className="relative group p-3 rounded-lg border bg-background shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="font-mono font-bold text-sm">{room.roomNumber}</div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-50 group-hover:opacity-100"><MoreHorizontal className="h-3 w-3" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-xs" onClick={() => { setSelectedRoom(room); editRoomForm.reset(room); setIsEditRoomOpen(true); }}><Pencil className="mr-2 h-3 w-3" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-xs text-destructive" onClick={() => onDeleteRoom(room._id)}><Trash className="mr-2 h-3 w-3" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-2">
                                            <Badge variant="outline" className={`text-[10px] h-4 px-1.5 font-normal border-0 ${room.status === 'VACANT' ? 'bg-chart-1/10 text-chart-1' : room.status === 'OCCUPIED' ? 'bg-chart-3/10 text-chart-3' : 'bg-destructive/10 text-destructive'}`}>
                                                {room.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Create Building Modal */}
            <Dialog open={isAddBuildingOpen} onOpenChange={setIsAddBuildingOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>New Building</DialogTitle></DialogHeader>
                    <Form {...buildingForm}>
                        <form onSubmit={buildingForm.handleSubmit(onAddBuilding)} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={buildingForm.control} name="buildingId" render={({ field }) => (
                                    <FormItem className="col-span-1"><FormLabel className="text-xs">ID</FormLabel><FormControl><Input placeholder="B-01" className="text-xs font-mono" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={buildingForm.control} name="name" render={({ field }) => (
                                    <FormItem className="col-span-2"><FormLabel className="text-xs">Name</FormLabel><FormControl><Input placeholder="Building Name" className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={buildingForm.control} name="place" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Location</FormLabel><FormControl><Input placeholder="Location" className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter><Button type="submit" size="sm">Create</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Building Modal */}
            <Dialog open={isEditBuildingOpen} onOpenChange={setIsEditBuildingOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Edit Building</DialogTitle></DialogHeader>
                    <Form {...buildingForm}>
                        <form onSubmit={buildingForm.handleSubmit(onEditBuilding)} className="space-y-4">
                            <FormField control={buildingForm.control} name="buildingId" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">ID (Read-only)</FormLabel><FormControl><Input disabled className="text-xs font-mono bg-muted" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={buildingForm.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={buildingForm.control} name="place" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Location</FormLabel><FormControl><Input className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter><Button type="submit" size="sm">Update</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Room Modal */}
            <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
                <DialogContent className="sm:max-w-[300px]">
                    <DialogHeader><DialogTitle>Edit Unit</DialogTitle></DialogHeader>
                    <Form {...editRoomForm}>
                        <form onSubmit={editRoomForm.handleSubmit(onEditRoom)} className="space-y-4">
                            <FormField control={editRoomForm.control} name="roomNumber" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Unit Number</FormLabel><FormControl><Input className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter><Button type="submit" size="sm">Save</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
