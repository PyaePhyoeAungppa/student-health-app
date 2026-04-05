"use client";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";
import { User, Mail, Globe, Shield, Building, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
    const { data: session } = useSession();
    const { t, language, setLanguage } = useLanguage();

    if (!session?.user) return null;

    const user = session.user as any;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="page-header mb-6">
                <div>
                    <h1 className="page-title">{t("userProfile")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{t("accountSettings")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Avatar & Quick Info */}
                <div className="md:col-span-1">
                    <div className="glass-card p-8 flex flex-col items-center text-center sticky top-24">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 ring-4 ring-primary/10">
                            <User className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${user.role === "SYSTEM_ADMIN" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            user.role === "COMPANY_STAFF" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            }`}>
                            {user.role?.replace("_", " ")}
                        </span>

                        <div className="mt-8 w-full space-y-4 text-left border-t border-border pt-6">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            {user.schoolName && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Building className="w-4 h-4 shrink-0" />
                                    <span>{user.schoolName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Detailed Settings */}
                <div className="md:col-span-2 space-y-6">
                    {/* Language Settings */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Globe className="w-5 h-5" />
                            <h3 className="font-bold">{t("language")}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${language === "en"
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border hover:border-border/80 hover:bg-black/5"
                                    }`}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">{t("english")}</span>
                                    <span className="text-xs opacity-70">English Interface</span>
                                </div>
                                {language === "en" && <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />}
                            </button>

                            <button
                                onClick={() => setLanguage("th")}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${language === "th"
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border hover:border-border/80 hover:bg-black/5"
                                    }`}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">{t("thai")}</span>
                                    <span className="text-xs opacity-70">อินเทอร์เฟซภาษาไทย</span>
                                </div>
                                {language === "th" && <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />}
                            </button>
                        </div>
                    </div>

                    {/* Account Info Details */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Shield className="w-5 h-5" />
                            <h3 className="font-bold">{t("personalInfo")}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("fullName")}</label>
                                <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border text-sm italic text-muted-foreground">{user.name}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("email")}</label>
                                <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border text-sm italic text-muted-foreground">{user.email || "—"}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("role")}</label>
                                <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border text-sm italic text-muted-foreground">{user.role}</div>
                            </div>
                            {user.schoolName && (
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("school")}</label>
                                    <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border text-sm italic text-muted-foreground">{user.schoolName}</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                            <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-200/80 leading-relaxed">
                                Managed accounts are controlled by administrators. To change your personal details, please contact your system administrator. Language preferences are saved locally and synced with your account.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
