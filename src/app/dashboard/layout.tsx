import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div className="flex h-screen overflow-hidden relative flex-col md:flex-row">
            <MobileHeader />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8 pb-24 md:pb-8 animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
            <MobileNav />
        </div>
    );
}
