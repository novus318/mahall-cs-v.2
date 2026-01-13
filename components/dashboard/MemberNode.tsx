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
    const borderColor = isHead ? 'border-yellow-500' : (isResident ? 'border-slate-300 border-dashed' : 'border-slate-200');
    const roleColor = isHead ? 'text-yellow-700 bg-yellow-50' : (isResident ? 'text-slate-500 bg-slate-50' : 'text-blue-600 bg-blue-50');

    // Gender Strip
    const genderStripColor = gender === 'Male' ? 'bg-blue-400' : (gender === 'Female' ? 'bg-pink-400' : 'bg-slate-300');

    // Status logic
    const isMovedOut = status === 'Moved Out';

    return (
        <div className={cn(
            "flex flex-col w-[200px] bg-white dark:bg-neutral-900 rounded-lg shadow-sm border-2 overflow-hidden transition-all hover:shadow-md",
            borderColor,
            isHead && "shadow-yellow-100 dark:shadow-none",
            isMovedOut && "opacity-60 grayscale-[0.5]" // Visual dimming for moved out
        )}>
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-slate-400 !w-3 !h-1 !rounded-[2px]" />

            {/* Header Strip */}
            <div className={cn("h-1.5 w-full", isMovedOut ? "bg-slate-400" : genderStripColor)} />

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
                            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
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
                        {gender === 'Male' ? <User className="h-3 w-3" /> : (gender === 'Female' ? <User className="h-3 w-3 text-pink-400" /> : null)}
                        <span className="opacity-80">{gender}</span>
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-slate-400 !w-3 !h-1 !rounded-[2px]" />
        </div>
    );
});
