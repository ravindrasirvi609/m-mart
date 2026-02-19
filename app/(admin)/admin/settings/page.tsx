import { STORE } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Store, Shield, HardDrive } from "lucide-react";

export const metadata = {
    title: "Admin Settings",
};

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="font-heading text-xl sm:text-2xl font-black text-text-main">Settings</h1>
                <p className="text-xs sm:text-sm text-text-subtle">Manage your store configuration and preferences.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store size={20} className="text-brand-red" />
                            Store Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Store Name</p>
                            <p className="text-sm font-medium text-text-main">{STORE.name}</p>
                        </div>
                        <div className="grid gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Owner</p>
                            <p className="text-sm font-medium text-text-main">{STORE.owner}</p>
                        </div>
                        <div className="grid gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Location</p>
                            <p className="text-sm font-medium text-text-main">{STORE.location}</p>
                        </div>
                        <div className="grid gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Phone</p>
                            <p className="text-sm font-medium text-text-main">{STORE.phone}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield size={20} className="text-blue-500" />
                            Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-text-main">Free Delivery Threshold</p>
                                <p className="text-xs text-text-subtle">Minimum amount for free shipping</p>
                            </div>
                            <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm font-black text-blue-500">
                                ₹{STORE.freeDeliveryThreshold}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-text-main">Base Delivery Charge</p>
                                <p className="text-xs text-text-subtle">Standard shipping fee</p>
                            </div>
                            <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm font-black text-blue-500">
                                ₹{STORE.baseDeliveryCharge}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive size={20} className="text-emerald-500" />
                            System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-admin-border bg-white/[0.02] p-4">
                                <p className="text-[10px] font-bold text-text-subtle uppercase">Database</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-bold text-text-main">Connected</span>
                                </div>
                            </div>
                            <div className="rounded-xl border border-admin-border bg-white/[0.02] p-4">
                                <p className="text-[10px] font-bold text-text-subtle uppercase">Storage</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-bold text-text-main">Active</span>
                                </div>
                            </div>
                            <div className="rounded-xl border border-admin-border bg-white/[0.02] p-4">
                                <p className="text-[10px] font-bold text-text-subtle uppercase">API Latency</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-sm font-bold text-text-main">24ms</span>
                                </div>
                            </div>
                            <div className="rounded-xl border border-admin-border bg-white/[0.02] p-4">
                                <p className="text-[10px] font-bold text-text-subtle uppercase">Version</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-sm font-bold text-text-main">v2.1.0-admin</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
