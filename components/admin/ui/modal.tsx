"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-dashboard/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg origin-center overflow-hidden rounded-3xl border border-admin-border bg-admin-card shadow-2xl transition-all animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b border-admin-border px-6 py-4">
                    <div>
                        {title && <h3 className="font-heading text-lg font-bold text-white">{title}</h3>}
                        {description && <p className="text-xs text-text-subtle">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-text-subtle hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
