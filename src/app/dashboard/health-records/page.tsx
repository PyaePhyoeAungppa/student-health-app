"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Search, Eye } from "lucide-react";
import Link from "next/link";
import { formatDate, getBMICategory } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export default function HealthRecordsPage() {
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const role = (session?.user as any)?.role;
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/health-records")
            .then(r => r.json())
            .then(d => { setRecords(Array.isArray(d) ? d : []); setLoading(false); });
    }, []);

    return (
        <div>
            <div className="page-header flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-auto">
                    <h1 className="page-title">{t("healthRecords")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{records.length} {t("totalRecords")}</p>
                </div>
                {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                    <Link href="/dashboard/health-records/new"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all w-full sm:w-auto"
                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                        <Plus className="w-4 h-4" /> {t("addRecord")}
                    </Link>
                )}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t("students")}</th>
                                <th>{t("school")}</th>
                                <th>{t("year")}</th>
                                <th>{t("bmi")}</th>
                                <th>{t("bloodTypeDist")?.replace(" Distribution", "") || "Blood"}</th>
                                <th>{t("hearingRecords")}</th>
                                <th>{t("colorVision")}</th>
                                <th>{t("date")}</th>
                                <th>{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                </td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">{t("noData")}</td></tr>
                            ) : records.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <div>
                                            <p className="font-medium">{r.student?.firstName} {r.student?.surName}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{r.student?.studentId}</p>
                                        </div>
                                    </td>
                                    <td><span className="text-xs text-muted-foreground">{r.student?.school?.name}</span></td>
                                    <td>{r.academicYear || "—"}</td>
                                    <td>{r.bmi ?? "—"}</td>
                                    <td>
                                        <span className="text-xs font-mono text-red-400">{r.bloodType}</span>
                                    </td>
                                    <td>
                                        <span className={r.hearingTest === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{r.hearingTest}</span>
                                    </td>
                                    <td>
                                        <span className={r.colorBlindness === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{r.colorBlindness}</span>
                                    </td>
                                    <td className="text-xs text-muted-foreground">{formatDate(r.recordedAt, language)}</td>
                                    <td>
                                        <Link href={`/dashboard/students/${r.student?.id}`} className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                                            <Eye className="w-4 h-4" /> {t("view")}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
