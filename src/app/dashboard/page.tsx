"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { HeartPulse, Users, FileText, Building2, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

interface Stats {
    totalStudents: number;
    totalRecords: number;
    avgBmi: number;
    bmiDistribution: { underweight: number; normal: number; overweight: number; obese: number };
    hearingStats: { hearingTest: string; _count: number }[];
    colorBlindStats: { colorBlindness: string; _count: number }[];
    bloodTypeStats: { bloodType: string; _count: number }[];
    genderStats: { gender: string; _count: number }[];
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const role = (session?.user as any)?.role;

    useEffect(() => {
        fetch("/api/reports")
            .then(r => r.json())
            .then(d => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const statCards = [
        { label: "totalStudents", value: stats?.totalStudents ?? 0, icon: Users, color: "hsl(150,60%,45%)", bg: "hsl(150,60%,45%,0.1)" },
        { label: "activeRecords", value: stats?.totalRecords ?? 0, icon: FileText, color: "hsl(25, 85%, 55%)", bg: "hsl(25, 85%, 55%,0.1)" },
        { label: "bmi", value: stats?.avgBmi ?? 0, icon: HeartPulse, color: "hsl(142,76%,45%)", bg: "hsl(142,76%,45%,0.1)" },
        { label: "schools", value: role === "SCHOOL_STAFF" ? 1 : (stats?.totalRecords ? "—" : 0), icon: Building2, color: "hsl(38,92%,50%)", bg: "hsl(38,92%,50%,0.1)" },
    ];

    const hearingAbnormal = stats?.hearingStats?.find(h => h.hearingTest === "ABNORMAL")?._count ?? 0;
    const colorBlindAbnormal = stats?.colorBlindStats?.find(c => c.colorBlindness === "ABNORMAL")?._count ?? 0;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t("dashboard")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t("welcome")}, <span className="text-foreground font-medium">{session?.user?.name}</span>
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/dashboard/students" className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors border border-primary/20 text-center">
                        {t("students")} →
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                                <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <TrendingUp className="w-4 h-4 text-green-400 opacity-60" />
                        </div>
                        <p className="text-3xl font-bold">{loading ? "—" : value}</p>
                        <p className="text-muted-foreground text-sm mt-1">{t(label as any)}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* BMI Distribution */}
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">{t("bmi")}</h2>
                    {loading ? <div className="h-40 flex items-center justify-center text-muted-foreground">{t("loading")}</div> : (
                        <div className="space-y-3">
                            {[
                                { label: "Underweight (< 18.5)", key: "Underweight", value: stats?.bmiDistribution.underweight ?? 0, color: "#60a5fa" },
                                { label: "Normal (18.5 – 24.9)", key: "Normal", value: stats?.bmiDistribution.normal ?? 0, color: "#4ade80" },
                                { label: "Overweight (25 – 29.9)", key: "Overweight", value: stats?.bmiDistribution.overweight ?? 0, color: "#facc15" },
                                { label: "Obese (≥ 30)", key: "Obese", value: stats?.bmiDistribution.obese ?? 0, color: "#f87171" },
                            ].map(({ label, value, color }) => {
                                const total = (stats?.totalRecords || 1);
                                const pct = Math.round((value / total) * 100);
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium">{value} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                                        </div>
                                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Health Alerts */}
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">{t("recentActivity")}</h2>
                    <div className="space-y-3">
                        <div className={`p-4 rounded-lg border flex items-center gap-3 ${hearingAbnormal > 0 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-green-500/10 border-green-500/20"}`}>
                            {hearingAbnormal > 0 ? <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                            <div>
                                <p className="text-sm font-medium">{hearingAbnormal > 0 ? `${hearingAbnormal} ${t("students")}` : t("noData")} — {t("hearingRecords") || "Hearing"}</p>
                                <p className="text-xs text-muted-foreground">{hearingAbnormal > 0 ? "Require follow-up hearing tests" : "All hearing tests normal"}</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border flex items-center gap-3 ${colorBlindAbnormal > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-green-500/10 border-green-500/20"}`}>
                            {colorBlindAbnormal > 0 ? <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                            <div>
                                <p className="text-sm font-medium">{colorBlindAbnormal > 0 ? `${colorBlindAbnormal} ${t("students")}` : t("noData")} — {t("colorVision") || "Color Vision"}</p>
                                <p className="text-xs text-muted-foreground">{colorBlindAbnormal > 0 ? "Color blindness detected" : "All color vision tests normal"}</p>
                            </div>
                        </div>
                        {stats?.bmiDistribution && (
                            <div className={`p-4 rounded-lg border flex items-center gap-3 ${stats.bmiDistribution.obese > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}>
                                {stats.bmiDistribution.obese > 0 ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                                <div>
                                    <p className="text-sm font-medium">{stats.bmiDistribution.obese > 0 ? `${stats.bmiDistribution.obese} ${t("students")}` : t("noData")} — BMI Obese</p>
                                    <p className="text-xs text-muted-foreground">{stats.bmiDistribution.obese > 0 ? "Students with BMI ≥ 30 require attention" : "No obese BMI cases"}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Blood Type Distribution */}
            {stats?.bloodTypeStats && stats.bloodTypeStats.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">{t("bloodTypeDist")}</h2>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap gap-4">
                        {stats.bloodTypeStats.map(({ bloodType, _count }) => (
                            <div key={bloodType} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 border border-border min-w-[80px]">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                    <span className="text-red-400 font-bold text-sm">{bloodType}</span>
                                </div>
                                <span className="text-2xl font-bold">{_count}</span>
                                <span className="text-xs text-muted-foreground">{t("students")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
