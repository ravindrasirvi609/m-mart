import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: "default" | "glass" | "outline";
}

export function Card({ children, className, variant = "default", ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border transition-all",
                variant === "default" && "border-admin-border bg-admin-card shadow-sm",
                variant === "glass" && "border-white/10 bg-white/5 backdrop-blur-md",
                variant === "outline" && "border-admin-border bg-transparent",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-6 py-4 border-b border-admin-border", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("font-heading text-lg font-bold text-white", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-sm text-text-subtle", className)} {...props}>
            {children}
        </p>
    );
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-6", className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-6 py-4 border-t border-admin-border", className)} {...props}>
            {children}
        </div>
    );
}
