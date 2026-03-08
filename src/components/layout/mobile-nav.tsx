"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, UserCircle, GraduationCap, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";

const mobileNavItems = [
    { href: "/dashboard", label: "dashboard", icon: LayoutDashboard, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/students", label: "students", icon: GraduationCap, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/health-records", label: "healthRecords", icon: FileText, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
    { href: "/dashboard/profile", label: "profile", icon: UserCircle, roles: ["SYSTEM_ADMIN", "SCHOOL_STAFF", "COMPANY_STAFF"] },
];

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useLanguage();
    const role = (session?.user as any)?.role;

    const filteredItems = mobileNavItems.filter(item => item.roles.includes(role)).slice(0, 4);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border px-2 pb-safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                {filteredItems.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/dashboard"
                        ? pathname === "/dashboard"
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
