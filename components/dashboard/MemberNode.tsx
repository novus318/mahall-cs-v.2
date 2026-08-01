import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Crown, User, Heart, Baby, PersonStanding } from 'lucide-react';
import { cn } from '@/lib/utils';

export default memo(({ data, isConnectable }: any) => {
    const { label, subLabel, gender, dateOfBirth, isHead, isSpouse, isResident, status } = data; // Added status

    // Calculate Age
    const getAge = (dob: string) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return `${age}y`;
    };

    const age = getAge(dateOfBirth);
    const borderColor = isHead ? 'border-chart-2' : (isResident ? 'border-muted-foreground/30 border-dashed' : 'border-border');
    const roleColor = isHead ? 'text-chart-2 bg-chart-2/10' : (isResident ? 'text-muted-foreground bg-muted/40' : 'text-primary bg-primary/10');

    // Gender Strip
    const genderStripColor = gender === 'Male' ? 'bg-primary' : (gender === 'Female' ? 'bg-chart-3' : 'bg-muted-foreground/30');

    // Status logic
    const isMovedOut = status === 'Moved Out';

    return (
        <div className={cn(
            "flex flex-col w-[200px] bg-card rounded-lg shadow-sm border-2 overflow-hidden transition-all hover:shadow-md",
            borderColor,
            isHead && "shadow-chart-2/10",
            isMovedOut && "opacity-60 grayscale-[0.5]" // Visual dimming for moved out
        )}>
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-muted-foreground !w-3 !h-1 !rounded-[2px]" />

            {/* Header Strip */}
            <div className={cn("h-1.5 w-full", isMovedOut ? "bg-muted-foreground/50" : genderStripColor)} />

            <div className="p-3 flex flex-col gap-2">
                {/* Header: Role & Avatar */}
                <div className="flex items-start justify-between">
                    {(isHead || isResident) ? (
                        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1", roleColor)}>
                            {isHead && <Crown className="h-3 w-3" />}
                            {isHead ? 'Head' : 'Resident'}
                        </div>
                    ) : (
                        isMovedOut ? (
                            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-destructive/10 text-destructive border border-destructive/20">
                                Moved Out
                            </div>
                        ) : <div className="h-5"></div>
                    )}

                    {age && <span className="text-[10px] text-muted-foreground font-mono">{age}</span>}
                </div>

                {/* Body: Name & Details */}
                <div className="flex flex-col">
                    <span className={cn("font-bold text-sm text-foreground truncate", isMovedOut && "line-through text-muted-foreground")} title={label}>{label}</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        {gender === 'Male' ? <User className="h-3 w-3" /> : (gender === 'Female' ? <User className="h-3 w-3 text-chart-3" /> : null)}
                        <span className="opacity-80">{gender}</span>
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-muted-foreground !w-3 !h-1 !rounded-[2px]" />
        </div>
    );
});
