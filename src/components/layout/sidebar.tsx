"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard, Users, FileText, BarChart3, Building2, Settings,
    LogOut, HeartPulse, UserCheck, ChevronRight, ChevronDown, GraduationCap
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/students", label: "Students", icon: GraduationCap, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/health-records", label: "Health Records", icon: FileText, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF"] },
    { href: "/dashboard/schools", label: "Schools", icon: Building2, roles: ["SYSTEM_ADMIN"] },
    { href: "/dashboard/users", label: "User Management", icon: UserCheck, roles: ["SYSTEM_ADMIN"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const [collapsed, setCollapsed] = useState(false);

    const filteredNav = navItems.filter(item => item.roles.includes(role));

    return (
        <aside className={`flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                    <HeartPulse className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="font-bold text-sm gradient-text">HealthTrack TH</p>
                        <p className="text-[10px] text-muted-foreground">Health Management</p>
                    </div>
                )}
                <button onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
                </button>
            </div>

            {/* Role Badge */}
            {!collapsed && (
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${role === "SYSTEM_ADMIN" ? "bg-primary" :
                                role === "COMPANY_STAFF" ? "bg-accent" : "bg-green-400"
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
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="px-2 py-4 border-t border-border space-y-1">
                {!collapsed && (
                    <div className="px-4 py-2 mb-1">
                        <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                )}
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? "justify-center px-0" : ""}`}>
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
