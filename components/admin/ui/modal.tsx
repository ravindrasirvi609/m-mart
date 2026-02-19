"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div
                className="absolute inset-0 bg-dashboard/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl origin-center flex-col overflow-hidden rounded-3xl border border-admin-border bg-admin-card shadow-2xl transition-all animate-in zoom-in-95 duration-300">
                <div className="flex items-start justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-6">
                    <div>
                        {title && <h3 className="font-heading text-lg font-bold text-text-main">{title}</h3>}
                        {description && <p className="text-xs text-text-subtle">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-text-subtle hover:bg-white/10 hover:text-text-main transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 sm:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
