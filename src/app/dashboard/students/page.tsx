"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Download, Eye, FileText, Filter, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

interface Student {
    id: string;
    studentId: string;
    firstName: string;
    surName: string;
    class: string;
    gender: string;
    orderNumber: number;
    school: { name: string };
    healthRecords: { bmi: number | null; weight: number | null; height: number | null; hearingTest: string; colorBlindness: string }[];
}

export default function StudentsPage() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const role = (session?.user as any)?.role;
    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [classFilter, setClassFilter] = useState("");

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "15" });
        if (search) params.set("search", search);
        if (classFilter) params.set("class", classFilter);
        const res = await fetch(`/api/students?${params}`);
        const data = await res.json();
        setStudents(data.students || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, [page, search, classFilter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const exportExcel = async () => {
        const XLSX = (await import("xlsx")).default;
        const rows = students.map(s => ({
            [t("studentId")]: s.studentId,
            "Order No.": s.orderNumber,
            [t("class")]: s.class,
            [t("firstName")]: s.firstName,
            [t("lastName")]: s.surName,
            [t("gender")]: s.gender,
            [t("school")]: s.school?.name,
            [t("bmi")]: s.healthRecords[0]?.bmi ?? "—",
            [t("weight")]: s.healthRecords[0]?.weight ?? "—",
            [t("height")]: s.healthRecords[0]?.height ?? "—",
            [t("hearingRecords")]: s.healthRecords[0]?.hearingTest ?? "—",
            [t("colorVision")]: s.healthRecords[0]?.colorBlindness ?? "—",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "students_export.xlsx");
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t("students")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{total} {t("studentsFound")}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button onClick={exportExcel} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                        <Download className="w-4 h-4" /> {t("export")}
                    </button>
                    {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF" || role === "SCHOOL_STAFF") && (
                        <Link href="/dashboard/students/import" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-primary/20 bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                            <Upload className="w-4 h-4" /> Import
                        </Link>
                    )}
                    {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                        <Link href="/dashboard/students/new" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 shadow-sm"
                            style={{ background: "linear-gradient(135deg, hsl(150,60%,45%) 0%, hsl(25,85%,55%) 100%)" }}>
                            <Plus className="w-4 h-4" /> {t("addStudent")}
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder={t("filterClass")}
                        value={classFilter}
                        onChange={e => { setClassFilter(e.target.value); setPage(1); }}
                        className="flex-1 sm:w-36 pl-3 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t("studentId")}</th>
                                <th>{t("fullName")}</th>
                                <th>{t("class")}</th>
                                <th>{t("gender")}</th>
                                <th>{t("bmi")}</th>
                                <th>{t("hearingRecords")}</th>
                                <th>{t("colorVision")}</th>
                                <th>{t("school")}</th>
                                <th>{t("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">{t("noData")}</td></tr>
                            ) : students.map(s => {
                                const hr = s.healthRecords[0];
                                const bmi = hr?.bmi;
                                const bmiColor = !bmi ? "" : bmi < 18.5 ? "text-blue-400" : bmi < 25 ? "text-green-400" : bmi < 30 ? "text-yellow-400" : "text-red-400";
                                return (
                                    <tr key={s.id}>
                                        <td><span className="font-mono text-xs text-muted-foreground">{s.studentId}</span></td>
                                        <td><div>
                                            <p className="font-medium">{s.firstName} {s.surName}</p>
                                            <p className="text-xs text-muted-foreground">No. {s.orderNumber}</p>
                                        </div></td>
                                        <td><span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{s.class}</span></td>
                                        <td><span className={`text-xs ${s.gender === "Male" ? "text-blue-400" : "text-pink-400"}`}>{s.gender}</span></td>
                                        <td><span className={`font-semibold ${bmiColor}`}>{bmi ?? "—"}</span></td>
                                        <td>{hr ? <span className={hr.hearingTest === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{hr.hearingTest}</span> : "—"}</td>
                                        <td>{hr ? <span className={hr.colorBlindness === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{hr.colorBlindness}</span> : "—"}</td>
                                        <td><span className="text-xs text-muted-foreground truncate max-w-[150px] block">{s.school?.name}</span></td>
                                        <td>
                                            <Link href={`/dashboard/students/${s.id}`} className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                                                <Eye className="w-4 h-4" /> {t("view")}
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
                        <p className="text-sm text-muted-foreground">{t("page")} {page} {t("of")} {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1 rounded-md bg-secondary border border-border text-sm disabled:opacity-40 hover:bg-secondary/80 transition-colors">
                                {t("previous")}
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-3 py-1 rounded-md bg-secondary border border-border text-sm disabled:opacity-40 hover:bg-secondary/80 transition-colors">
                                {t("next")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
