'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
    src: string;
    className?: string;
    isOutbound?: boolean;
}

export default function AudioPlayer({ src, className, isOutbound = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [error, setError] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setError(false);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        const handleError = () => {
            setError(true);
            setIsPlaying(false);
        };

        // Add event listeners
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Preload metadata to get duration
        audio.preload = "metadata";

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    // Also pause if the src changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setError(false);
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Pause all other audio elements on the page (optional global behavior)
            document.querySelectorAll('audio').forEach((el) => {
                if (el !== audioRef.current) {
                    el.pause();
                }
            });
            audioRef.current.play().catch(err => {
                console.error("Audio play failed:", err);
                setError(true);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
        setCurrentTime(newTime);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn(
            "flex items-center gap-2 p-2 rounded-xl min-w-60",
            isOutbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            className
        )}>
            <audio ref={audioRef} src={src} className="hidden" />

            <div className="shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full",
                        isOutbound
                            ? "hover:bg-primary-foreground/20 text-primary-foreground"
                            : "hover:bg-background/50 text-foreground"
                    )}
                    onClick={togglePlay}
                    disabled={error}
                >
                    {error ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                    ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                </Button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={cn(
                        "w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-current",
                        isOutbound ? "accent-white bg-white/30" : "accent-primary bg-primary/20",
                        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full",
                        isOutbound
                            ? "[&::-webkit-slider-thumb]:bg-white"
                            : "[&::-webkit-slider-thumb]:bg-primary"
                    )}
                />
                <div className={cn(
                    "flex justify-between text-[10px] font-medium opacity-80",
                    isOutbound ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}
