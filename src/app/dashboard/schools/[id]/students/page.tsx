"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Search, Plus, Download, Eye, Filter, Loader2, Upload, X, ChevronLeft, ChevronRight, Columns3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { useParams, useRouter } from "next/navigation";

interface HealthRecord {
    bmi: number | null;
    weight: number | null;
    height: number | null;
    hearingTest: string;
    colorBlindness: string;
    bloodType: string;
    symptoms: string;
    bodyExamination: string;
    eyeTest: string;
    visualAcuity: string;
    eyeExamReport: string;
    flexibility: number | null;
    handgripStrength: number | null;
    standingKneeRaises: number | null;
    situps: number | null;
    pushups: number | null;
    xRayResult: string;
}

interface Student {
    id: string;
    studentId: string;
    prefix?: string;
    firstName: string;
    surName: string;
    gender?: string;
    class: string;
    room?: string;
    orderNumber: number;
    school: { name: string; id: string };
    healthRecords: HealthRecord[];
}

export default function SchoolStudentsPage() {
    const params = useParams();
    const router = useRouter();
    const schoolId = params.id as string;
    const { data: session } = useSession();
    const { t } = useLanguage();

    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [schoolName, setSchoolName] = useState("");

    const [classFilter, setClassFilter] = useState("");
    const [hearingFilter, setHearingFilter] = useState("");
    const [colorFilter, setColorFilter] = useState("");

    const activeFilterCount = [classFilter, hearingFilter, colorFilter].filter(Boolean).length;

    useEffect(() => {
        fetch(`/api/schools/${schoolId}`)
            .then(r => r.json())
            .then(d => setSchoolName(d.name || ""))
            .catch(() => {});
    }, [schoolId]);

    const clearFilters = () => {
        setClassFilter(""); setHearingFilter(""); setColorFilter("");
        setPage(1);
    };

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const params2 = new URLSearchParams({ page: String(page), limit: "15", schoolId });
        if (search) params2.set("search", search);
        if (classFilter) params2.set("class", classFilter);
        if (hearingFilter) params2.set("hearing", hearingFilter);
        if (colorFilter) params2.set("colorBlindness", colorFilter);
        const res = await fetch(`/api/students?${params2}`);
        const data = await res.json();
        setStudents(data.students || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, [page, search, classFilter, hearingFilter, colorFilter, schoolId]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const statusBadge = (hr: HealthRecord | undefined) => {
        if (!hr) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">{t("noData")}</span>;
        const hasIssue = hr.hearingTest === "ABNORMAL" || hr.colorBlindness === "ABNORMAL";
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${hasIssue ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>{hasIssue ? t("abnormal") : t("normal")}</span>;
    };

    return (
        <div>
            {/* Breadcrumb */}
            <div className="mb-2">
                <Link href={`/dashboard/schools/${schoolId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t("dashboard")}
                </Link>
            </div>

            <div className="page-header flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-auto">
                    <h1 className="page-title">{t("students")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">📍 {schoolName} · {total} {t("totalRecords")}</p>
                </div>
                <div className="flex gap-2 sm:ml-auto">
                    <Link href={`/dashboard/students/new?schoolId=${schoolId}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                        <Plus className="w-4 h-4" /> {t("addStudent")}
                    </Link>
                    <Link href={`/dashboard/students/import?schoolId=${schoolId}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-secondary hover:bg-secondary/80 transition-all">
                        <Upload className="w-4 h-4" /> Import
                    </Link>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`${t("search")} ${t("students").toLowerCase()}...`}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <input type="text" placeholder={t("class")} value={classFilter}
                        onChange={e => { setClassFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-28" />
                    <select value={hearingFilter} onChange={e => { setHearingFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">{t("hearingTest")}</option>
                        <option value="NORMAL">{t("normal")}</option>
                        <option value="ABNORMAL">{t("abnormal")}</option>
                    </select>
                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> {t("cancel")} ({activeFilterCount})
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-secondary/30">
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t("studentId")}</th>
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t("fullName")}</th>
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t("class")}</th>
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t("gender")}</th>
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{t("healthCheckResult")}</th>
                                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">{t("noData")}</td></tr>
                            ) : students.map(s => {
                                const hr = s.healthRecords[0];
                                return (
                                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-sm">{s.studentId}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium">{s.prefix} {s.firstName} {s.surName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.class}{s.room ? `/${s.room}` : ""}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.gender === "MALE" ? t("male") : s.gender === "FEMALE" ? t("female") : "—"}</td>
                                        <td className="px-4 py-3">{statusBadge(hr)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/dashboard/students/${s.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                                                <Eye className="w-3.5 h-3.5" /> {t("view")}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <span className="text-sm text-muted-foreground">{t("page")} {page} {t("of")} {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
