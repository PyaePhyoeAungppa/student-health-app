"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Search, Plus, Download, Eye, Filter, Loader2, Upload, X, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

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
    cbc?: string;
    fbs?: string;
    cholesterol?: string;
    hbsag?: string;
    ua?: string;
    amphetamine?: string;
    underlyingDisease?: string;
    drugAllergy?: string;
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

interface School {
    id: string;
    name: string;
    testsConfig?: Record<string, boolean>;
}

// ─── Column definitions ───────────────────────────────────────────────────────

type ColKey =
    | "studentId" | "class" | "room" | "orderNumber" | "prefix" | "firstName" | "lastName"
    | "congenitalDisease" | "drugAllergy" | "bloodType" | "age" | "weight" | "height"
    | "healthCheckResult" | "hearingTest" | "eyeTest" | "visualAcuity" | "colorBlindness"
    | "flexibility" | "handgripStrength" | "standingKneeRaises" | "situps" | "pushups" | "xRayResult"
    | "cbc" | "fbs" | "cholesterol" | "hbsag" | "ua" | "amphetamine";

const ALL_COLUMNS_ORDER: ColKey[] = [
    "studentId", "class", "room", "orderNumber", "prefix", "firstName", "lastName",
    "congenitalDisease", "drugAllergy", "bloodType", "age", "weight", "height",
    "healthCheckResult", "hearingTest", "eyeTest", "visualAcuity", "colorBlindness",
    "flexibility", "handgripStrength", "standingKneeRaises", "situps", "pushups", "xRayResult",
    "cbc", "fbs", "cholesterol", "hbsag", "ua", "amphetamine"
];

const COL_LABELS: Record<ColKey, string> = {
    studentId: "Student ID",
    class: "Class",
    room: "Room",
    orderNumber: "Order",
    prefix: "Prefix",
    firstName: "First Name",
    lastName: "Last Name",
    congenitalDisease: "Congenital Disease",
    drugAllergy: "Drug Allergy",
    bloodType: "Blood Type",
    age: "Age",
    weight: "Weight",
    height: "Height",
    healthCheckResult: "Health Result",
    hearingTest: "Hearing Test",
    eyeTest: "Vision Range",
    visualAcuity: "Vision Result",
    colorBlindness: "Color Vision",
    flexibility: "ความอ่อนตัว (ซม.)",
    handgripStrength: "แรงบีบมือ : Hand Grip Strength",
    standingKneeRaises: "ยืนยกเข่า 3 นาที : 3 Minutes Step Up and Down",
    situps: "ลุก-นั่ง 60 วินาที : 60 Seconds Sit-ups",
    pushups: "ดันพื้นประยุกต์ 30 วินาที : 30 Seconds Modified Push-ups",
    xRayResult: "X-Ray",
    cbc: "ความสมบูรณ์ของเม็ดเลือด (CBC)",
    fbs: "ระดับน้ำตาลในเลือด (FBS)",
    cholesterol: "ระดับไขมันในเลือด (Cholesterol)",
    hbsag: "ตรวจหาเชื้อไวรัสตับอักเสบบี (HBSAG)",
    ua: "ตรวจปัสสาวะทั่วไป (UA)",
    amphetamine: "ตรวจหาสารเสพติดในปัสสาวะ (Amphetamine)",
};

const LS_KEY = "students_visible_cols_v2";

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const role = (session?.user as any)?.role;
    const userSchoolId = (session?.user as any)?.schoolId;

    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // Filters
    const [classFilter, setClassFilter] = useState("");
    const [hearingFilter, setHearingFilter] = useState("");
    const [colorFilter, setColorFilter] = useState("");

    // Schools & column config
    const [schools, setSchools] = useState<School[]>([]);

    const [visibleColumns, setVisibleColumns] = useState<Set<ColKey>>(new Set(ALL_COLUMNS_ORDER));
    const [colsReady, setColsReady] = useState(false);

    // Columns modal
    const [showColMenu, setShowColMenu] = useState(false);
    const colMenuRef = useRef<HTMLDivElement>(null);
    const colBtnRef = useRef<HTMLButtonElement>(null);

    const activeFilterCount = [classFilter, hearingFilter, colorFilter].filter(Boolean).length;

    // ── Fetch schools → compute enabled columns ──────────────────────────────
    useEffect(() => {
        fetch("/api/schools")
            .then(r => r.json())
            .then((data: School[]) => {
                setSchools(data);

                // Load from localStorage or use enabled columns as default
                const defaultVisible = new Set<ColKey>(ALL_COLUMNS_ORDER);

                try {
                    const saved = localStorage.getItem(LS_KEY);
                    if (saved) {
                        const parsed: ColKey[] = JSON.parse(saved);
                        // Keep only valid column keys
                        const valid = parsed.filter(k => ALL_COLUMNS_ORDER.includes(k as ColKey)) as ColKey[];
                        setVisibleColumns(new Set(valid));
                    } else {
                        setVisibleColumns(defaultVisible);
                    }
                } catch {
                    setVisibleColumns(defaultVisible);
                }

                setColsReady(true);
            })
            .catch(() => setColsReady(true));
    }, [role, userSchoolId]);

    // ── Persist column visibility ────────────────────────────────────────────
    useEffect(() => {
        if (!colsReady) return;
        localStorage.setItem(LS_KEY, JSON.stringify(Array.from(visibleColumns)));
    }, [visibleColumns, colsReady]);

    // ── Close column modal on Escape ─────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowColMenu(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // ── Fetch students ───────────────────────────────────────────────────────
    const clearFilters = () => {
        setClassFilter(""); setHearingFilter(""); setColorFilter("");
        setPage(1);
    };

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "15" });
        if (search) params.set("search", search);
        if (classFilter) params.set("class", classFilter);
        if (hearingFilter) params.set("hearing", hearingFilter);
        if (colorFilter) params.set("colorBlindness", colorFilter);
        const res = await fetch(`/api/students?${params}`);
        const data = await res.json();
        setStudents(data.students || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, [page, search, classFilter, hearingFilter, colorFilter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    // ── Export ───────────────────────────────────────────────────────────────
    const exportExcel = async () => {
        const XLSX = await import("xlsx");
        const rows = students.map(s => {
            const hr = s.healthRecords[0];
            const row: Record<string, any> = {
                [t("studentId")]: s.studentId,
                [t("class")]: s.class,
                [t("room")]: s.room || "",
                [t("orderNumber")]: s.orderNumber,
                [t("prefix")]: s.prefix || "",
                [t("firstName")]: s.firstName,
                [t("lastName")]: s.surName,
                [t("congenitalDisease")]: hr?.underlyingDisease || "",
                [t("drugAllergy")]: hr?.drugAllergy || "",
                [t("bloodType")]: hr?.bloodType || "",
                [t("age")]: (s as any).age ?? "",
                [t("weight")]: hr?.weight ?? "",
                [t("height")]: hr?.height ?? "",
                [t("healthCheckResult")]: hr?.symptoms ?? "",
                [t("hearingTest")]: hr?.hearingTest ?? "",
                [t("eyeTest")]: hr?.eyeTest ?? "",
                [t("visualAcuity")]: hr?.visualAcuity ?? "",
                [t("colorBlindness")]: hr?.colorBlindness ?? "",
            };
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "students_export.xlsx");
    };


    // ── Pagination ───────────────────────────────────────────────────────────
    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | "...")[] = [1];
        if (page > 3) pages.push("...");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    // ── Column toggle helpers ────────────────────────────────────────────────
    const toggleCol = (key: ColKey) => {
        setVisibleColumns(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const resetCols = () => {
        setVisibleColumns(new Set(ALL_COLUMNS_ORDER));
    };

    // Ordered visible columns
    const orderedVisible = ALL_COLUMNS_ORDER.filter(k => visibleColumns.has(k));
    const colSpan = orderedVisible.length + 1;

    // ── Cell renderer ────────────────────────────────────────────────────────
    const renderCell = (col: ColKey, s: Student) => {
        const hr = s.healthRecords[0];
        const bmi = hr?.bmi;
        const bmiColor = !bmi ? "" : bmi < 18.5 ? "text-blue-400" : bmi < 25 ? "text-green-400" : bmi < 30 ? "text-yellow-400" : "text-red-400";

        switch (col) {
            case "studentId":
                return <td key={col}><span className="font-mono text-xs text-muted-foreground">{s.studentId}</span></td>;
            case "class":
                return <td key={col}><span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{s.class}</span></td>;
            case "room":
                return <td key={col}><span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{s.room || "—"}</span></td>;
            case "orderNumber":
                return <td key={col}><span className="text-sm">{s.orderNumber}</span></td>;
            case "prefix":
                return <td key={col}><span className="text-sm">{s.prefix || "—"}</span></td>;
            case "firstName":
                return (
                    <td key={col}>
                        <Link href={`/dashboard/students/${s.id}`} className="font-medium text-primary hover:underline">{s.firstName}</Link>
                    </td>
                );
            case "lastName":
                return <td key={col}><span className="text-sm font-medium">{s.surName}</span></td>;
            case "congenitalDisease":
                return <td key={col}><span className="text-xs">{hr?.underlyingDisease || "—"}</span></td>;
            case "drugAllergy":
                return <td key={col}><span className="text-xs">{hr?.drugAllergy || "—"}</span></td>;
            case "bloodType":
                return <td key={col}><span className="text-xs font-bold text-red-500/80">{hr?.bloodType || "—"}</span></td>;
            case "age":
                return <td key={col}><span className="text-sm">{(s as any).age ?? "—"}</span></td>;
            case "weight":
                return <td key={col}><span className="text-sm">{hr?.weight ?? "—"}</span></td>;
            case "height":
                return <td key={col}><span className="text-sm">{hr?.height ?? "—"}</span></td>;
            case "healthCheckResult":
                return <td key={col}><span className="text-xs truncate max-w-[120px] block">{hr?.symptoms || "—"}</span></td>;
            case "hearingTest":
                return (
                    <td key={col}>
                        {hr ? (
                            <span className={hr.hearingTest?.toLowerCase().includes("normal") || hr.hearingTest?.includes("ปกติ") ? "badge-normal" : hr.hearingTest ? "badge-abnormal" : ""}>
                                {hr.hearingTest || "—"}
                            </span>
                        ) : "—"}
                    </td>
                );
            case "eyeTest":
                return <td key={col}><span className="text-xs">{hr?.eyeTest || "—"}</span></td>;
            case "visualAcuity":
                return <td key={col}><span className="text-xs">{hr?.visualAcuity || "—"}</span></td>;
            case "colorBlindness":
                return (
                    <td key={col}>
                        {hr ? (
                            <span className={hr.colorBlindness?.toLowerCase().includes("pass") || hr.colorBlindness?.toLowerCase().includes("normal") || hr.colorBlindness?.includes("ปกติ") ? "badge-normal" : hr.colorBlindness ? "badge-abnormal" : ""}>
                                {hr.colorBlindness || "—"}
                            </span>
                        ) : "—"}
                    </td>
                );
            case "flexibility":
                return <td key={col}><span className="text-sm">{hr?.flexibility != null ? hr.flexibility : "—"}</span></td>;
            case "handgripStrength":
                return <td key={col}><span className="text-sm">{hr?.handgripStrength != null ? hr.handgripStrength : "—"}</span></td>;
            case "standingKneeRaises":
                return <td key={col}><span className="text-sm">{hr?.standingKneeRaises != null ? hr.standingKneeRaises : "—"}</span></td>;
            case "situps":
                return <td key={col}><span className="text-sm">{hr?.situps != null ? hr.situps : "—"}</span></td>;
            case "pushups":
                return <td key={col}><span className="text-sm">{hr?.pushups != null ? hr.pushups : "—"}</span></td>;
            case "xRayResult":
                return <td key={col}><span className="text-sm">{hr?.xRayResult || "—"}</span></td>;
            case "cbc":
                return <td key={col}><span className="text-sm">{hr?.cbc || "—"}</span></td>;
            case "fbs":
                return <td key={col}><span className="text-sm">{hr?.fbs || "—"}</span></td>;
            case "cholesterol":
                return <td key={col}><span className="text-sm">{hr?.cholesterol || "—"}</span></td>;
            case "hbsag":
                return <td key={col}><span className="text-sm">{hr?.hbsag || "—"}</span></td>;
            case "ua":
                return <td key={col}><span className="text-sm">{hr?.ua || "—"}</span></td>;
            case "amphetamine":
                return <td key={col}><span className="text-sm">{hr?.amphetamine || "—"}</span></td>;
            default:
                return <td key={col}>—</td>;
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
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
                            style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                            <Plus className="w-4 h-4" /> {t("addStudent")}
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter + Column Toggle Panel */}
            <div className="glass-card p-3 mb-5">
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="hidden sm:block w-px h-7 bg-border" />

                    {/* Class */}
                    <input
                        type="text"
                        placeholder={t("filterClass")}
                        value={classFilter}
                        onChange={e => { setClassFilter(e.target.value); setPage(1); }}
                        className="w-28 px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />


                    {/* Hearing */}
                    <select value={hearingFilter} onChange={e => { setHearingFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">{t("hearingRecords")}: {t("all")}</option>
                        <option value="NORMAL">{t("normal")}</option>
                        <option value="ABNORMAL">{t("abnormal")}</option>
                    </select>

                    {/* Color Vision */}
                    <select value={colorFilter} onChange={e => { setColorFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">{t("colorVision")}: {t("all")}</option>
                        <option value="NORMAL">{t("normal")}</option>
                        <option value="ABNORMAL">{t("abnormal")}</option>
                    </select>

                    {/* Clear filters */}
                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                            <X className="w-3.5 h-3.5" />
                            Clear ({activeFilterCount})
                        </button>
                    )}

                    {/* Columns toggle */}
                    <div className="ml-auto">
                        <button
                            ref={colBtnRef}
                            onClick={() => setShowColMenu(true)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${showColMenu ? "bg-primary/10 border-primary/30 text-primary" : "border-border hover:bg-secondary text-muted-foreground"}`}
                        >
                            <Columns3 className="w-3.5 h-3.5" />
                            Columns
                            <span className="ml-0.5 bg-primary/15 text-primary rounded px-1 font-semibold">
                                {orderedVisible.length}
                            </span>
                        </button>

                        {showColMenu && createPortal(
                            <div
                                className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                                onClick={(e) => { if (e.target === e.currentTarget) setShowColMenu(false); }}
                            >
                                <div
                                    ref={colMenuRef}
                                    className="bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col"
                                    style={{ maxHeight: "80vh" }}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                        <div>
                                            <h2 className="font-semibold text-base">Table Columns</h2>
                                            <p className="text-xs text-muted-foreground mt-0.5">{orderedVisible.length} of {ALL_COLUMNS_ORDER.length} visible</p>
                                        </div>
                                        <button onClick={() => setShowColMenu(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Scrollable body */}
                                    <div className="overflow-y-auto flex-1 px-4 py-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Table Columns</p>
                                        <div className="grid grid-cols-2 gap-1 mb-4">
                                            {ALL_COLUMNS_ORDER.map(key => (
                                                <label key={key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                                                    <input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleCol(key)} className="w-3.5 h-3.5 rounded accent-primary" />
                                                    <span className="text-sm text-foreground">{t(key as any) || COL_LABELS[key]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Footer */}
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                                        <button onClick={resetCols} className="text-sm text-primary hover:underline font-medium">Reset to defaults</button>
                                        <button onClick={() => setShowColMenu(false)}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                            style={{ background: "linear-gradient(135deg, hsl(212,100%,52%) 0%, hsl(199,89%,48%) 100%)" }}
                                        >Done</button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}


                    </div>

                    {/* Filter count */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Filter className="w-3.5 h-3.5" />
                        <span>{total} {t("studentsFound")}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {orderedVisible.map(col => (
                                    <th key={col}>{t(col as any) || COL_LABELS[col]}</th>
                                ))}
                                <th className="w-16 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={colSpan} className="text-center py-12 text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={colSpan} className="text-center py-12 text-muted-foreground">{t("noData")}</td></tr>
                            ) : students.map(s => (
                                <tr key={s.id}>
                                    {orderedVisible.map(col => renderCell(col, s))}
                                    <td className="text-right">
                                        <Link href={`/dashboard/students/${s.id}`} className="p-2 inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors bg-secondary/50 hover:bg-secondary rounded-lg" title="View Student">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <p className="text-xs text-muted-foreground hidden sm:block">
                            {t("page")} <strong>{page}</strong> {t("of")} <strong>{totalPages}</strong> · {total} {t("studentsFound")}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 transition-colors" aria-label="Previous page">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {getPageNumbers().map((p, i) =>
                                p === "..." ? (
                                    <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
                                ) : (
                                    <button key={p} onClick={() => setPage(p as number)}
                                        className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${page === p ? "text-white shadow-sm" : "hover:bg-secondary text-foreground"}`}
                                        style={page === p ? { background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" } : {}}>
                                        {p}
                                    </button>
                                )
                            )}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 transition-colors" aria-label="Next page">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
