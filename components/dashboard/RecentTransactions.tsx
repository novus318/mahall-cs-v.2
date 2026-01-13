import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Wallet } from "lucide-react";

interface Transaction {
    _id: string;
    type: 'OPENING_BALANCE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    date: string;
    account?: { _id: string; name: string };
    relatedAccount?: { name: string };
    payment?: { _id: string };
    receipt?: { _id: string };
    staff?: { _id: string };
    contract?: { _id: string };
}

interface RecentTransactionsProps {
    transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const getIconAndColor = (type: string) => {
        switch (type) {
            case 'INCOME':
            case 'TRANSFER_IN':
                return { icon: ArrowDownLeft, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" };
            case 'EXPENSE':
            case 'TRANSFER_OUT':
                return { icon: ArrowUpRight, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20" };
            case 'OPENING_BALANCE':
                return { icon: Wallet, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" };
            default:
                return { icon: ArrowRightLeft, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" };
        }
    };

    const getLink = (transaction: Transaction) => {
        if (transaction.payment?._id) return `/dashboard/payments/edit/${transaction.payment._id}`;
        if (transaction.receipt?._id) return `/dashboard/receipts/${transaction.receipt._id}`;
        if (transaction.staff?._id) return `/dashboard/staff/${transaction.staff._id}`;
        if (transaction.contract?._id) return `/dashboard/contracts/${transaction.contract._id}`;
        if (transaction.account?._id) return `/dashboard/accounts/${transaction.account._id}`;
        return '#';
    };

    return (
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-950/50 py-3 min-h-[468px]">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity across all accounts</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
                    ) : (
                        transactions.map((transaction) => {
                            const { icon: Icon, color, bg } = getIconAndColor(transaction.type);
                            const link = getLink(transaction);

                            return (
                                <Link href={link} key={transaction._id} className="block group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-9 w-9 group-hover:scale-105 transition-transform">
                                                <AvatarFallback className={bg}>
                                                    <Icon className={`h-4 w-4 ${color}`} />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                                    {transaction.description || transaction.type.replace('_', ' ')}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{transaction.account?.name}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(transaction.date), 'MMM d, h:mm a')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-medium ${color}`}>
                                            {(transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' || transaction.type === 'OPENING_BALANCE') ? '+' : '-'}
                                            ₹{transaction.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
