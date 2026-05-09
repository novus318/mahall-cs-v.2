'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Check,
    CheckCheck,
    Phone,
    Video,
    Search,
    MoreVertical,
    Paperclip,
    Send,
    Smile,
    Mic,
    ArrowLeft,
    RefreshCw,
    User,
    FileText,
    MapPin,
    Sticker,
    ImageIcon,
    FileIcon,
    VideoIcon,
    MicIcon,
    Trash2,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import EmojiPicker from 'emoji-picker-react';
import AudioPlayer from '@/components/whatsapp/AudioPlayer';


// Types
interface Contact {
    _id: string;
    phoneNumber: string;
    profileName: string;
    displayName: string;
    type: 'MEMBER' | 'TENANT' | 'STAFF' | 'UNKNOWN' | 'VENDOR';
    linkedEntityId: string | null;
    linkedEntityModel: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

interface Message {
    _id: string;
    contact: string;
    direction: 'INBOUND' | 'OUTBOUND';
    type: string;
    body: string;
    mediaUrl?: string;
    status: string;
    timestamp: string;
    mediaId?: string;
    isAnimated?: boolean;
    replyTo?: Message;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function WhatsAppPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [mimeType, setMimeType] = useState('audio/webm');

    // Helper: Format Duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Start Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Determine supported mime type
            let selectedMimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                selectedMimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
                selectedMimeType = 'audio/ogg; codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
                selectedMimeType = 'audio/webm; codecs=opus';
            }

            setMimeType(selectedMimeType);

            const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error: any) {
            console.error("Error accessing microphone:", error);
            if (error.name === 'NotAllowedError') {
                toast.error("Microphone permission denied. Please allow access.");
            } else if (error.name === 'NotFoundError') {
                toast.error("No microphone found. Please check your device.");
            } else {
                toast.error("Could not access microphone.");
            }
        }
    };

    // Stop and Send Recording
    const handleSendVoice = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.onstop = async () => {
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

            setSending(true);
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');

            try {
                const uploadRes = await api.post('/whatsapp/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const mediaId = uploadRes.data.mediaId;

                const res = await api.post('/whatsapp/send', {
                    contactId: selectedContact?._id,
                    messageType: 'audio',
                    content: mediaId
                });

                setMessages(prev => [...prev, res.data.data]);

                if (selectedContact) {
                    setContacts(prev => prev.map(c =>
                        c._id === selectedContact._id ? {
                            ...c,
                            lastMessage: `You: 🎤 Voice Message`,
                            lastMessageAt: new Date().toISOString()
                        } : c
                    ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
                }

            } catch (error: any) {
                toast.error("Failed to send voice message");
            } finally {
                setSending(false);
                setIsRecording(false);
                setRecordingDuration(0);
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            }
        };

        mediaRecorderRef.current.stop();
    };

    // File Attachment Logic
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = '';

        setSending(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await api.post('/whatsapp/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const mediaId = uploadRes.data.mediaId;

            let messageType = 'document';
            if (file.type.startsWith('image/')) messageType = 'image';
            else if (file.type.startsWith('video/')) messageType = 'video';
            else if (file.type.startsWith('audio/')) messageType = 'audio';

            const res = await api.post('/whatsapp/send', {
                contactId: selectedContact?._id,
                messageType: messageType,
                content: mediaId,
                caption: file.name
            });

            setMessages(prev => [...prev, res.data.data]);

            if (selectedContact) {
                setContacts(prev => prev.map(c =>
                    c._id === selectedContact._id ? {
                        ...c,
                        lastMessage: `You: 📎 ${file.name}`,
                        lastMessageAt: new Date().toISOString()
                    } : c
                ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
            }

        } catch (error: any) {
            console.error("File upload error:", error);
            toast.error("Failed to send file");
        } finally {
            setSending(false);
        }
    };

    // Cancel Recording
    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setRecordingDuration(0);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };

    // 1. Fetch Contacts
    const fetchContacts = async () => {
        try {
            const res = await api.get('/whatsapp/contacts');
            setContacts(res.data.data);
        } catch (error) {
            toast.error("Failed to load contacts");
        } finally {
            setLoadingContacts(false);
        }
    };

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 30000);
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch Messages when Contact Selected
    useEffect(() => {
        if (selectedContact) {
            const fetchMessages = async () => {
                setLoadingMessages(true);
                try {
                    const res = await api.get(`/whatsapp/messages/${selectedContact._id}`);
                    setMessages(res.data.data);
                    setContacts(prev => prev.map(c =>
                        c._id === selectedContact._id ? { ...c, unreadCount: 0 } : c
                    ));
                } catch (error) {
                    toast.error("Failed to load messages");
                } finally {
                    setLoadingMessages(false);
                }
            };
            fetchMessages();
        }
    }, [selectedContact]);

    // 3. Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages, loadingMessages]);

    // 4. Send Message
    const handleSend = async () => {
        if (!selectedContact || !inputText.trim()) return;

        setSending(true);
        try {
            const res = await api.post('/whatsapp/send', {
                contactId: selectedContact._id,
                messageType: 'text',
                content: inputText
            });

            setMessages([...messages, res.data.data]);
            setInputText('');

            setContacts(prev => prev.map(c =>
                c._id === selectedContact._id ? {
                    ...c,
                    lastMessage: `You: ${inputText.substring(0, 20)}...`,
                    lastMessageAt: new Date().toISOString()
                } : c
            ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send");
        } finally {
            setSending(false);
        }
    };

    // 5. Refresh Entity Link
    const handleRefreshLink = async () => {
        if (!selectedContact) return;
        try {
            const res = await api.post(`/whatsapp/refresh/${selectedContact._id}`);
            if (res.data.success) {
                toast.success(res.data.message);
                setSelectedContact(res.data.data);
                setContacts(prev => prev.map(c => c._id === selectedContact._id ? res.data.data : c));
            } else {
                toast.info("No matching entity found");
            }
        } catch (error) {
            toast.error("Failed to refresh link");
        }
    };

    // Format Time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return format(date, 'h:mm a');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return formatTime(dateStr);
        return format(date, 'MMM d');
    };

    const handleScrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-1', 'ring-primary', 'ring-offset-1', 'bg-primary/10');
            setTimeout(() => element.classList.remove('ring-1', 'ring-primary', 'ring-offset-1', 'bg-primary/10'), 2000);
        } else {
            toast.info("Message not loaded in current view");
        }
    };

    return (
        <div className="flex flex-1 h-[calc(100vh-4.5rem)] bg-background">
            {/* LEFT PANE: Contact List */}
            <div className={cn(
                "flex flex-col bg-muted/10 h-[calc(100vh-4.5rem)] border-r border-border md:w-72 shrink-0",
                selectedContact ? "hidden md:flex" : "w-full flex"
            )}>
                <div className="p-3 border-b border-border shrink-0 bg-muted/10">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search chats"
                            className="pl-8 h-9 text-sm bg-background/50 border-input focus-visible:bg-background transition-colors"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
                    {loadingContacts ? (
                        <div className="p-2 space-y-2">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5 p-1">
                            {contacts.map(contact => (
                                <button
                                    key={contact._id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={cn(
                                        "flex items-center gap-3 p-2 text-left transition-all rounded-md mx-1",
                                        selectedContact?._id === contact._id
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted/50 text-foreground"
                                    )}
                                >
                                    <Avatar className="h-9 w-9 border border-border/50">
                                        <AvatarFallback className={cn("text-xs font-medium", selectedContact?._id === contact._id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                            {contact.displayName?.substring(0, 2).toUpperCase() || '??'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-semibold text-[13px] truncate leading-none">{contact.displayName}</span>
                                            <span className={cn("text-[10px]", contact.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground")}>
                                                {formatDate(contact.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn("text-[11px] truncate max-w-[140px]", contact.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                                                {contact.lastMessage || 'No messages'}
                                            </p>
                                            {contact.unreadCount > 0 && (
                                                <Badge className="h-4 min-w-4 px-1 flex items-center justify-center bg-primary hover:bg-primary/90 rounded-full text-[9px] border-0 text-primary-foreground shadow-none">
                                                    {contact.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* MIDDLE PANE: Chat Window */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 bg-muted relative",
                selectedContact ? "flex" : "hidden md:flex"
            )}>
                {/* Chat Wallpaper Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="h-14 md:h-14 lg:h-16 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-3 md:px-5 lg:px-6 shrink-0 z-10">
                            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 min-w-0 flex-1">
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-9 w-9 shrink-0" onClick={() => setSelectedContact(null)}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <Avatar className="h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 ring-2 ring-border shrink-0">
                                    <AvatarFallback className="text-xs md:text-sm lg:text-base bg-primary/10 text-primary font-medium">{selectedContact.displayName?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm md:text-base lg:text-lg leading-none tracking-tight truncate">{selectedContact.displayName}</h3>
                                    <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5">
                                        {selectedContact.type !== 'UNKNOWN' && <Badge variant="secondary" className="h-4 md:h-5 px-1.5 md:px-2 text-[9px] md:text-[10px] rounded-sm font-normal text-muted-foreground">{selectedContact.type}</Badge>}
                                        <span className="text-[10px] md:text-xs text-muted-foreground font-mono truncate">{selectedContact.phoneNumber}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2 shrink-0">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleRefreshLink}>
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Refresh Client Link</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>View Contact Info</DropdownMenuItem>
                                        <DropdownMenuItem>Search in Chat</DropdownMenuItem>
                                        <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Clear Chat
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 px-2 md:px-6 lg:px-8" ref={scrollRef}>
                            <div className="space-y-2 pb-3 pt-2 md:pt-4 min-h-full max-w-350 mx-auto">
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full min-h-[200px]">
                                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex justify-center items-center h-full min-h-[200px]">
                                        <p className="text-sm text-muted-foreground">No messages yet</p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, index) => {
                                            const isOutbound = msg.direction === 'OUTBOUND';

                                            return (
                                                <div key={msg._id} id={`msg-${msg._id}`} className={cn(
                                                    "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200 transition-all",
                                                    isOutbound ? "justify-end" : "justify-start"
                                                )}>
                                                    <div className={cn(
                                                        "max-w-[85%] md:max-w-[70%] lg:max-w-[60%] shadow-sm relative group mb-0.5 text-sm md:text-base min-w-[8%]",
                                                        isOutbound
                                                            ? "bg-primary text-primary-foreground rounded-xl rounded-tr-sm"
                                                            : "bg-card text-card-foreground border border-border rounded-xl rounded-tl-sm",
                                                        (msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker' || msg.type === 'audio' || msg.type === 'document') ? "p-1 md:p-1.5 bg-black/1 border-none shadow-none" : "px-3 py-2 md:px-4 md:py-2.5"
                                                    )}>

                                                        {/* Reply Quote */}
                                                        {msg.replyTo && (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (msg.replyTo) handleScrollToMessage(msg.replyTo._id);
                                                                }}
                                                                className={cn(
                                                                    "mb-1 rounded-lg p-1.5 text-xs border-l-4 opacity-90 cursor-pointer overflow-hidden hover:opacity-100 transition-opacity",
                                                                    isOutbound
                                                                        ? "bg-primary-foreground/10 border-primary-foreground/50 text-primary-foreground"
                                                                        : "bg-muted/50 border-primary/50 text-muted-foreground"
                                                                )}>
                                                                <p className="font-semibold text-[10px] mb-0.5 opacity-80">
                                                                    {msg.replyTo.direction === 'INBOUND' ? 'Them' : 'You'}
                                                                </p>
                                                                <p className="truncate line-clamp-1">
                                                                    {msg.replyTo.type === 'image' ? '📷 Image'
                                                                        : msg.replyTo.type === 'video' ? '🎥 Video'
                                                                            : msg.replyTo.type === 'audio' ? '🎤 Audio'
                                                                                : msg.replyTo.type === 'sticker' ? '💟 Sticker'
                                                                                    : msg.replyTo.type === 'document' ? '📄 Document'
                                                                                        : msg.replyTo.body}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {msg.type === 'text' ? (
                                                            <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed break-words">{msg.body}</p>
                                                        ) : msg.type === 'image' ? (
                                                            <div className="flex flex-col">
                                                                {msg.mediaId ? (
                                                                    <img
                                                                        src={`${API_BASE_URL}/whatsapp/media/${msg.mediaId}`}
                                                                        alt="Image"
                                                                        className="rounded-xl w-full max-w-[240px] md:max-w-[260px] max-h-[240px] md:max-h-[260px] object-cover cursor-pointer hover:opacity-95 transition-opacity bg-black/5"
                                                                        onClick={() => window.open(`${API_BASE_URL}/whatsapp/media/${msg.mediaId}`, '_blank')}
                                                                        loading="lazy"
                                                                    />
                                                                ) : msg.mediaUrl ? (
                                                                    <img src={msg.mediaUrl} alt="Image" className="rounded-xl w-full max-w-[240px] md:max-w-[260px] object-cover" loading="lazy" />
                                                                ) : (
                                                                    <div className="bg-muted rounded-xl p-4 text-xs italic text-center w-[200px] h-[150px] flex items-center justify-center">Image Unavailable</div>
                                                                )}
                                                                {msg.body && msg.body !== 'Image' && (
                                                                    <p className="text-xs md:text-sm mt-1 px-1 pb-1">{msg.body}</p>
                                                                )}
                                                            </div>
                                                        ) : msg.type === 'audio' ? (
                                                            <div className="flex items-center gap-2 min-w-[180px] p-1">
                                                                <div className="w-full">
                                                                    {msg.mediaId ? (
                                                                        <AudioPlayer
                                                                            src={`${API_BASE_URL}/whatsapp/media/${msg.mediaId}`}
                                                                            isOutbound={isOutbound}
                                                                        />
                                                                    ) : (
                                                                        <div className="flex flex-col text-xs leading-none gap-0.5 opacity-70 px-2 py-1">
                                                                            <span className="font-medium">Audio Processing...</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : msg.type === 'video' ? (
                                                            <div className="flex flex-col">
                                                                <div className="bg-black/90 rounded-xl relative overflow-hidden aspect-video w-52 md:w-60 flex items-center justify-center group/video cursor-pointer">
                                                                    {msg.mediaId ? (
                                                                        <video
                                                                            src={`${API_BASE_URL}/whatsapp/media/${msg.mediaId}`}
                                                                            controls
                                                                            className="w-full h-full object-cover rounded-xl"
                                                                        />
                                                                    ) : (
                                                                        <>
                                                                            <VideoIcon className="h-8 w-8 text-white/50" />
                                                                            <div className="absolute bottom-2 left-2 text-[10px] text-white/80 bg-black/40 px-1 rounded">Video</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {msg.body && msg.body !== 'Video Message' && <p className="text-xs md:text-sm mt-1 px-1 pb-1">{msg.body}</p>}
                                                            </div>
                                                        ) : msg.type === 'sticker' ? (
                                                            <div className="p-1">
                                                                {msg.mediaId ? (
                                                                    <img
                                                                        src={`${API_BASE_URL}/whatsapp/media/${msg.mediaId}`}
                                                                        alt="Sticker"
                                                                        className="h-20 w-20 md:h-24 md:w-24 object-contain"
                                                                    />
                                                                ) : (
                                                                    <Sticker className={cn("h-12 w-12", isOutbound ? "text-primary-foreground/80" : "text-foreground/50")} />
                                                                )}
                                                            </div>
                                                        ) : msg.type === 'location' ? (
                                                            <div className="flex flex-col gap-1 min-w-[200px]">
                                                                <div className="flex items-center gap-2 text-xs font-medium opacity-90 mb-1">
                                                                    <MapPin className="h-3.5 w-3.5" />
                                                                    Location
                                                                </div>
                                                                <div className="rounded-lg bg-muted/50 p-2 text-xs border border-border/50">
                                                                    <p className="line-clamp-2">{msg.body.split('https')[0]}</p>
                                                                </div>
                                                                <a
                                                                    href={`https${msg.body.split('https')[1]}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className={cn("text-[10px] underline decoration-dotted underline-offset-2", isOutbound ? "text-primary-foreground/80" : "text-primary")}
                                                                >
                                                                    Open in Maps
                                                                </a>
                                                            </div>
                                                        ) : msg.type === 'document' ? (
                                                            <div className="bg-background border rounded-lg flex items-center gap-3 p-2 min-w-[200px] cursor-pointer mb-1" onClick={() => msg.mediaId && window.open(`${API_BASE_URL}/whatsapp/media/${msg.mediaId}`, '_blank')}>
                                                                <div className="bg-red-100 p-2 rounded-lg text-red-600 shrink-0">
                                                                    <FileText className="h-5 w-5 md:h-6 md:w-6" />
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-xs md:text-sm font-medium truncate leading-tight max-w-[140px] md:max-w-[160px]">{msg.body}</span>
                                                                    <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase mt-0.5">Document</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="italic opacity-90 text-xs md:text-sm flex items-center gap-2">
                                                                <FileIcon className="h-3.5 w-3.5" />
                                                                [{msg.type.toUpperCase()}] {msg.body || 'Media'}
                                                            </div>
                                                        )}

                                                        <div className={cn(
                                                            "text-[8px] flex items-center justify-end gap-0.5 select-none opacity-90 mt-0.5",
                                                            (msg.type === 'image' || msg.type === 'video') ? "absolute bottom-1.5 right-1.5 text-white drop-shadow-md bg-black/20 px-1 rounded-full" : "",
                                                            isOutbound && !((msg.type === 'image' || msg.type === 'video')) ? "text-primary-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {formatTime(msg.timestamp)}
                                                            {isOutbound && (
                                                                <span>
                                                                    {msg.status === 'read' ? <CheckCheck className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area - Fixed at bottom */}
                        <div className="p-2 md:p-4 lg:p-5 bg-background border-t border-border shrink-0 safe-bottom">
                            <div className="flex w-full items-end gap-2 md:gap-3 max-w-350 mx-auto">
                                {isRecording ? (
                                    <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex-1 bg-red-50 border border-red-100 rounded-full md:rounded-[22px] flex items-center px-3 md:px-4 py-2 gap-2 md:gap-3 text-red-500 relative overflow-hidden min-h-[44px]">
                                            <div className="animate-pulse rounded-full bg-red-500 h-2 w-2 md:h-2.5 md:w-2.5 shrink-0"></div>
                                            <span className="font-mono font-medium text-xs md:text-sm tabular-nums text-red-600 min-w-[40px] md:min-w-[50px]">
                                                {formatDuration(recordingDuration)}
                                            </span>
                                            <span className="text-[10px] md:text-xs text-red-400 font-medium">Recording...</span>

                                            <div className="ml-auto flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={cancelRecording} className="h-7 w-7 md:h-8 md:w-8 hover:bg-red-100 hover:text-red-600 text-red-400 rounded-full" title="Cancel">
                                                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Button size="icon" className="h-11 w-11 md:h-10 md:w-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md animate-pulse shrink-0" onClick={handleSendVoice} disabled={sending}>
                                            {sending ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5 pl-0.5" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 md:h-10 md:w-10 lg:h-11 lg:w-11 rounded-full text-muted-foreground hover:text-foreground shrink-0" title="Attach File" disabled={sending}>
                                            <Paperclip className="h-5 w-5 md:h-5 md:w-5 lg:h-5.5 lg:w-5.5" />
                                        </Button>
                                        <div className="flex-1 bg-muted/30 border border-input focus-within:ring-1 focus-within:ring-primary/20 rounded-full md:rounded-[24px] lg:rounded-[26px] flex items-end px-3 md:px-4 lg:px-5 py-2 md:py-2.5 lg:py-3 min-h-[44px] max-h-[120px] md:max-h-[140px]">
                                            <Textarea
                                                className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 text-sm md:text-base resize-none max-h-[80px] md:max-h-[100px] min-h-[24px] placeholder:text-muted-foreground/70 leading-relaxed"
                                                placeholder="Type a message..."
                                                rows={1}
                                                value={inputText}
                                                onChange={(e) => {
                                                    setInputText(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    const maxHeight = window.innerWidth >= 768 ? 100 : 80;
                                                    const newHeight = Math.min(e.target.scrollHeight, maxHeight);
                                                    e.target.style.height = newHeight + 'px';
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend();
                                                    }
                                                }}
                                                disabled={sending}
                                            />
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0 ml-2 -mb-0.5" disabled={sending}>
                                                        <Smile className="h-4 w-4 md:h-4.5 md:w-4.5" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent side="top" className="w-full p-0 border-none shadow-none bg-transparent" align="end">
                                                    <EmojiPicker
                                                        onEmojiClick={(emojiData) => setInputText((prev) => prev + emojiData.emoji)}
                                                        lazyLoadEmojis={true}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {inputText.trim() ? (
                                                <Button size="icon" className="h-11 w-11 md:h-11 md:w-11 lg:h-12 lg:w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm" onClick={handleSend} disabled={sending}>
                                                    {sending ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5 pl-0.5" />}
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-11 w-11 md:h-11 md:w-11 lg:h-12 lg:w-12 rounded-full text-muted-foreground hover:text-foreground" onClick={startRecording} disabled={sending}>
                                                    <Mic className="h-5 w-5 md:h-5.5 md:w-5.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 p-4 md:p-8">
                        <div className="bg-slate-100 dark:bg-slate-800 p-8 md:p-10 lg:p-12 rounded-full mb-6">
                            <MessageIcon className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-base md:text-lg lg:text-xl font-medium text-slate-400 dark:text-slate-500 text-center">Select a chat to start messaging</p>
                        <p className="text-xs md:text-sm text-muted-foreground mt-2 text-center max-w-md">Choose a conversation from the list to view messages and send replies</p>
                    </div>
                )}
            </div>

            {/* RIGHT PANE: Info Panel (Only on large screens) */}
            {selectedContact && (
                <div className="w-80 lg:w-[340px] xl:w-[360px] border-l border-border bg-background p-0 hidden xl:flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 p-6 lg:p-8">
                        <div className="flex flex-col items-center mb-8">
                            <Avatar className="h-24 w-24 lg:h-28 lg:w-28 mb-4 border-4 border-slate-50 dark:border-slate-800">
                                <AvatarFallback className="text-2xl lg:text-3xl bg-slate-100 dark:bg-slate-800">{selectedContact.displayName?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <h2 className="font-bold text-lg lg:text-xl text-center leading-tight">{selectedContact.displayName}</h2>
                            <p className="text-sm lg:text-base text-muted-foreground mt-1.5">{selectedContact.phoneNumber}</p>
                            <Badge variant="secondary" className="mt-2.5 lg:mt-3 text-xs lg:text-sm">{selectedContact.type}</Badge>
                        </div>

                        <div className="space-y-6 lg:space-y-7">
                            {selectedContact.type !== 'UNKNOWN' && selectedContact.linkedEntityId ? (
                                <Card className="p-4 lg:p-5 border shadow-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                                    <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400 font-medium text-sm lg:text-base">
                                        <User className="h-4 w-4 lg:h-5 lg:w-5" />
                                        Linked Entity
                                    </div>
                                    <div className="space-y-2.5 text-sm lg:text-base text-slate-600 dark:text-slate-400">
                                        <div className="flex justify-between">
                                            <span>Type</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{selectedContact.linkedEntityModel}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Status</span>
                                            <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full mt-3 h-9 lg:h-10 text-xs lg:text-sm bg-white dark:bg-slate-950">
                                            View Profile
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-4 lg:p-5 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-2.5">
                                    <span className="text-xs lg:text-sm text-muted-foreground">Not Linked to System</span>
                                    <Button variant="secondary" size="sm" className="h-8 lg:h-9 text-xs lg:text-sm" onClick={handleRefreshLink}>Check again</Button>
                                </Card>
                            )}

                            <div>
                                <h4 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 lg:mb-4">Quick Actions</h4>
                                <div className="grid grid-cols-2 gap-2.5 lg:gap-3">
                                    <Button variant="outline" size="sm" className="h-24 lg:h-28 flex flex-col gap-2.5 lg:gap-3 hover:bg-slate-50 dark:hover:bg-slate-900">
                                        <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-slate-500 dark:text-slate-400" />
                                        <span className="text-xs lg:text-sm font-normal">Create Receipt</span>
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-24 lg:h-28 flex flex-col gap-2.5 lg:gap-3 hover:bg-slate-50 dark:hover:bg-slate-900">
                                        <Phone className="h-5 w-5 lg:h-6 lg:w-6 text-slate-500 dark:text-slate-400" />
                                        <span className="text-xs lg:text-sm font-normal">Call</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}

function MessageIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}
