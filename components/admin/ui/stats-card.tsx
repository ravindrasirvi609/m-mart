import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isUp: boolean;
    };
    color?: "red" | "blue" | "green" | "amber" | "rose" | "emerald";
}

const colorMap = {
    red: "bg-brand-red/10 text-brand-red border-brand-red/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    green: "bg-success/10 text-success border-success/20",
    amber: "bg-warning/10 text-warning border-warning/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function StatsCard({ title, value, icon: Icon, description, trend, color = "red" }: StatsCardProps) {
    return (
        <Card className="hover:border-brand-red/30 transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className={cn("rounded-xl p-2.5 border", colorMap[color])}>
                        <Icon size={24} />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                            trend.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                            {trend.isUp ? "+" : "-"}{trend.value}%
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <p className="text-sm font-medium text-text-subtle tracking-tight">{title}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <h4 className="text-2xl font-black text-text-main">{value}</h4>
                    </div>
                    {description && (
                        <p className="mt-1 text-xs text-text-subtle">{description}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
