"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";
import { User, Mail, Globe, Shield, Building, Calendar, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const getWavyCirclePath = (cx: number, cy: number, radius: number, waves: number, amplitude: number) => {
    let path = "";
    const points = 120;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius + Math.sin(angle * waves) * amplitude;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        path += (i === 0 ? "M " : " L ") + `${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return path + " Z";
};

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const { t, language, setLanguage } = useLanguage();

    // Profile details state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    
    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Loading & message states
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Sync input fields when session loads
    useEffect(() => {
        if (session?.user) {
            setFullName(session.user.name || "");
            setEmail(session.user.email || "");
        }
    }, [session]);

    if (!session?.user) return null;

    const user = session.user as any;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);

        const trimmedName = fullName.trim();
        if (!trimmedName) {
            setProfileMessage({ type: "error", text: "Full name cannot be empty" });
            return;
        }

        setProfileLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: trimmedName }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || t("profileUpdateError"));
            }

            // Update NextAuth session state
            await update({ name: trimmedName });

            setProfileMessage({ type: "success", text: t("profileUpdated") });
        } catch (err: any) {
            console.error(err);
            setProfileMessage({ type: "error", text: err.message || t("profileUpdateError") });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!currentPassword) {
            setPasswordMessage({ type: "error", text: "Current password is required" });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: "error", text: t("passwordTooShort") });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: t("passwordsDoNotMatch") });
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || t("profileUpdateError"));
            }

            setPasswordMessage({ type: "success", text: t("profileUpdated") });
            
            // Reset password fields on success
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error(err);
            setPasswordMessage({ type: "error", text: err.message || t("profileUpdateError") });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="page-header mb-6">
                <div>
                    <h1 className="page-title">{t("userProfile")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{t("accountSettings")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Avatar & Quick Info */}
                <div className="md:col-span-1">
                    <div className="glass-card p-8 flex flex-col items-center text-center sticky top-24 group">
                        <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm transition-transform duration-700 ease-in-out group-hover:rotate-180">
                                <defs>
                                    <linearGradient id="wavy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={getWavyCirclePath(50, 50, 44, 14, 2.5)}
                                    fill="url(#wavy-gradient)"
                                />
                                <circle cx="50" cy="50" r="37" fill="hsl(var(--card))" />
                                <circle cx="50" cy="50" r="34" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                            </svg>
                            <div className="relative z-10 w-[72px] h-[72px] rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-9 h-9 text-primary bouncy-avatar-icon" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                            user.role === "SYSTEM_ADMIN" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            user.role === "COMPANY_STAFF" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                            "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        }`}>
                            {user.role?.replace("_", " ")}
                        </span>

                        <div className="mt-8 w-full space-y-4 text-left border-t border-border pt-6">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span className="truncate">{user.email || "—"}</span>
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

                {/* Right Column: Detailed Settings */}
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
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                    language === "en"
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
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                    language === "th"
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

                    {/* Personal Information Form */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Shield className="w-5 h-5" />
                            <h3 className="font-bold">{t("personalInfo")}</h3>
                        </div>

                        {profileMessage && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 text-sm mb-6 border ${
                                profileMessage.type === "success" 
                                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}>
                                {profileMessage.type === "success" ? (
                                    <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                                )}
                                <span>{profileMessage.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("fullName")}</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={fullName} 
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{t("email")}</label>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        disabled
                                        readOnly
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground cursor-not-allowed opacity-70 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button 
                                    type="submit" 
                                    disabled={profileLoading} 
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}
                                >
                                    {profileLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("loading")}
                                        </>
                                    ) : (
                                        t("save")
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security & Password Form */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Lock className="w-5 h-5" />
                            <h3 className="font-bold">{t("securitySettings")}</h3>
                        </div>

                        {passwordMessage && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 text-sm mb-6 border ${
                                passwordMessage.type === "success" 
                                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}>
                                {passwordMessage.type === "success" ? (
                                    <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                                )}
                                <span>{passwordMessage.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t("currentPassword")}</label>
                                <input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("newPassword")}</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("confirmPassword")}</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button 
                                    type="submit" 
                                    disabled={passwordLoading} 
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}
                                >
                                    {passwordLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("loading")}
                                        </>
                                    ) : (
                                        t("changePassword")
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Metadata & Admin Note */}
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                        <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-200/80 leading-relaxed">
                            Profile details and password can be updated above. System-controlled roles and school assignments are managed by administrators. Language preferences are saved locally and synced with your account.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
