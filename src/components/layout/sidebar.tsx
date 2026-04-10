"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard, FileText, BarChart3, Building2, Settings,
    LogOut, HeartPulse, UserCheck, ChevronRight, GraduationCap
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";

const navItems = [
    { href: "/dashboard", label: "dashboard", icon: LayoutDashboard, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/students", label: "students", icon: GraduationCap, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/health-records", label: "healthRecords", icon: FileText, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/reports", label: "reports", icon: BarChart3, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF"] },
    { href: "/dashboard/schools", label: "schools", icon: Building2, roles: ["SYSTEM_ADMIN"] },
    { href: "/dashboard/users", label: "users", icon: UserCheck, roles: ["SYSTEM_ADMIN"] },
    { href: "/dashboard/profile", label: "profile", icon: Settings, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useLanguage();
    const role = (session?.user as any)?.role;
    const [collapsed, setCollapsed] = useState(false);

    const filteredNav = navItems.filter(item => item.roles.includes(role));

    return (
        <aside className={`hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300 relative ${collapsed ? "w-20" : "w-64"}`}>
            
            <button onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-7 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground z-10 shadow-sm transition-colors">
                <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            </button>

            {/* Logo */}
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-4"} py-5 border-b border-border min-h-[76px]`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                    <HeartPulse className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="font-bold text-sm gradient-text">{t("healthTrack")}</p>
                        <p className="text-[10px] text-muted-foreground">{t("management")}</p>
                    </div>
                )}
            </div>

            {/* Role Badge */}
            {!collapsed && (
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${role === "SYSTEM_ADMIN" ? "bg-primary" :
                            role === "COMPANY_STAFF" ? "bg-accent" : "bg-blue-400"
                            }`} />
                        <span className="text-muted-foreground">{
                            role === "SYSTEM_ADMIN" ? "System Admin" :
                                role === "COMPANY_STAFF" ? "Company Staff" : "School Staff"
                        }</span>
                    </div>
                    {(session?.user as any)?.schoolName && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            📍 {(session?.user as any).schoolName}
                        </p>
                    )}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {filteredNav.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                    return (
                        <Link key={href} href={href}
                            className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center px-0" : ""}`}>
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span>{t(label as any)}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="px-2 py-4 border-t border-border space-y-1">
                {!collapsed && (
                    <div className="px-4 py-2 mb-1">
                        <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                    </div>
                )}
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? "justify-center px-0" : ""}`}>
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{t("signOut")}</span>}
                </button>
            </div>
        </aside>
    );
}
