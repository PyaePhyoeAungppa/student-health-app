"use client";
import { signOut, useSession } from "next-auth/react";
import { LogOut, HeartPulse } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export default function MobileHeader() {
    const { data: session } = useSession();
    const { t } = useLanguage();

    return (
        <header className="md:hidden sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, hsl(150,60%,45%) 0%, hsl(25, 85%, 55%) 100%)" }}>
                    <HeartPulse className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm gradient-text">HealthTrack</span>
            </div>

            <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-xs font-medium"
            >
                <LogOut className="w-4 h-4" />
                {t("signOut")}
            </button>
        </header>
    );
}
