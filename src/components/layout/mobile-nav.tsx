"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, UserCircle, GraduationCap, BarChart3, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";

// Detect school context from pathname
function extractSchoolId(pathname: string): string | null {
    const match = pathname.match(/^\/dashboard\/schools\/([^\/]+)(\/|$)/);
    return match ? match[1] : null;
}

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useLanguage();
    const role = (session?.user as any)?.role;
    const isAdmin = role === "SYSTEM_ADMIN";
    const selectedSchoolId = isAdmin ? extractSchoolId(pathname) : null;

    // Build nav items based on context
    let navItems: { href: string; label: string; icon: any; exact?: boolean }[] = [];

    if (isAdmin && selectedSchoolId) {
        // Inside a school context
        navItems = [
            { href: "/dashboard/schools", label: "schools", icon: Building2, exact: true },
            { href: `/dashboard/schools/${selectedSchoolId}`, label: "dashboard", icon: LayoutDashboard, exact: true },
            { href: `/dashboard/schools/${selectedSchoolId}/students`, label: "students", icon: GraduationCap },
            { href: `/dashboard/schools/${selectedSchoolId}/reports`, label: "reports", icon: BarChart3 },
        ];
    } else if (isAdmin) {
        // Admin without school selected
        navItems = [
            { href: "/dashboard/schools", label: "schools", icon: Building2 },
            { href: "/dashboard/users", label: "users", icon: UserCircle },
            { href: "/dashboard/profile", label: "profile", icon: UserCircle },
        ];
    } else {
        // School staff / company staff
        navItems = [
            { href: "/dashboard", label: "dashboard", icon: LayoutDashboard, exact: true },
            { href: "/dashboard/students", label: "students", icon: GraduationCap },
            { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
            { href: "/dashboard/profile", label: "profile", icon: UserCircle },
        ];
        if (role === "COMPANY_STAFF") {
            navItems = navItems.filter(i => i.href !== "/dashboard/reports");
        }
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border px-2 pb-safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                {navItems.slice(0, 4).map(({ href, label, icon: Icon, exact }) => {
                    const isActive = exact
                        ? pathname === href
                        : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 h-full ${isActive ? "text-primary scale-105" : "text-muted-foreground"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 w-8 h-1 bg-primary rounded-full"
                                    style={{ boxShadow: "0 0 12px hsl(var(--primary))" }} />
                            )}
                            <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_hsl(var(--primary))]" : ""}`} />
                            <span className="text-[10px] font-semibold tracking-tight">{t(label as any)}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
