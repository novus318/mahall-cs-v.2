import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
    _id: string;
    type: 'OPENING_BALANCE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INCOME' | 'EXPENSE' | 'LOAN_RECEIVED' | 'LOAN_REPAYMENT';
    amount: number;
    description: string;
    date: string;
    account?: { _id: string; name: string };
    relatedAccount?: { name: string };
    payment?: { _id: string };
    receipt?: { _id: string };
    staff?: { _id: string };
    contract?: { _id: string };
    payable?: { _id: string };
}

interface RecentTransactionsProps {
    transactions: Transaction[];
}

const CREDIT_TYPES = ['INCOME', 'TRANSFER_IN', 'OPENING_BALANCE', 'LOAN_RECEIVED'];

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const getIconAndColor = (type: string) => {
        switch (type) {
            case 'INCOME':
            case 'TRANSFER_IN':
            case 'LOAN_RECEIVED':
                return { icon: ArrowDownLeft, color: "text-chart-1", bg: "bg-chart-1/10" };
            case 'EXPENSE':
            case 'TRANSFER_OUT':
            case 'LOAN_REPAYMENT':
                return { icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" };
            case 'OPENING_BALANCE':
                return { icon: Wallet, color: "text-chart-3", bg: "bg-chart-3/10" };
            default:
                return { icon: ArrowRightLeft, color: "text-muted-foreground", bg: "bg-muted/50" };
        }
    };

    const getLink = (transaction: Transaction) => {
        if (transaction.payment?._id) return `/dashboard/payments/edit/${transaction.payment._id}`;
        if (transaction.receipt?._id) return `/dashboard/receipts/edit/${transaction.receipt._id}`;
        if (transaction.staff?._id) return `/dashboard/staff/${transaction.staff._id}`;
        if (transaction.contract?._id) return `/dashboard/contracts/${transaction.contract._id}`;
        if (transaction.payable?._id) return `/dashboard/payables`;
        if (transaction.account?._id) return `/dashboard/accounts/${transaction.account._id}`;
        return '#';
    };

    return (
        <Card className="flex h-full flex-col bg-card py-3">
            <CardHeader className="flex flex-row items-start justify-between gap-2 px-6">
                <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription className="mt-1">Latest financial activity across all accounts</CardDescription>
                </div>
                <Link
                    href="/dashboard/transactions"
                    className="shrink-0 pt-1 text-sm font-medium text-primary hover:underline"
                >
                    View all
                </Link>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-2">
                {transactions.length === 0 ? (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
                            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {transactions.slice(0, 6).map((transaction) => {
                            const { icon: Icon, color, bg } = getIconAndColor(transaction.type);
                            const link = getLink(transaction);
                            const isCredit = CREDIT_TYPES.includes(transaction.type);

                            return (
                                <li key={transaction._id}>
                                    <Link href={link} className="group flex items-center justify-between gap-3 py-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", bg)}>
                                                <Icon className={cn("h-4 w-4", color)} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                                    {transaction.description || transaction.type.replace('_', ' ')}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {transaction.account?.name && (
                                                        <>
                                                            <span className="font-medium">{transaction.account.name}</span>
                                                            <span className="mx-1.5">·</span>
                                                        </>
                                                    )}
                                                    {format(new Date(transaction.date), 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className={cn(
                                                "text-sm font-semibold tabular-nums",
                                                isCredit ? "text-chart-1" : "text-destructive"
                                            )}>
                                                {isCredit ? "+" : "−"}₹{transaction.amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
