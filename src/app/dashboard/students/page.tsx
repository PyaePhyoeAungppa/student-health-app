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
    visionBothEyesLeft: string;
    visionBothEyesRight: string;
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
    thaiId?: string;
    firstName: string;
    surName: string;
    class: string;
    gender: string;
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
    | "studentId" | "thaiId" | "fullName" | "class" | "gender" | "age"
    | "weight" | "height" | "bmi" | "school" | "actions"
    // health config columns
    | "bloodType" | "tenSteps" | "symptoms" | "hearingTest"
    | "colorBlindness" | "eyeTest" | "visionBothEyes"
    | "flexibility" | "handgripStrength" | "standingKneeRaises"
    | "situps" | "pushups" | "xRayResult";

const BASE_COLUMNS: ColKey[] = ["studentId", "thaiId", "fullName", "class", "gender", "age", "weight", "height", "bmi", "school", "actions"];
const HEALTH_COLUMNS: ColKey[] = ["bloodType", "tenSteps", "symptoms", "hearingTest", "colorBlindness", "eyeTest", "visionBothEyes", "flexibility", "handgripStrength", "standingKneeRaises", "situps", "pushups", "xRayResult"];

// Map testsConfig key → ColKey
const TESTS_CONFIG_MAP: Record<string, ColKey> = {
    bloodType: "bloodType",
    tenSteps: "tenSteps",
    symptoms: "symptoms",
    hearingTest: "hearingTest",
    colorBlindness: "colorBlindness",
    eyeTest: "eyeTest",
    visionBothEyes: "visionBothEyes",
    flexibility: "flexibility",
    handgripStrength: "handgripStrength",
    standingKneeRaises: "standingKneeRaises",
    situps: "situps",
    pushups: "pushups",
    xRayResult: "xRayResult",
};

const COL_LABELS: Record<ColKey, string> = {
    studentId: "Student ID",
    thaiId: "Thai ID",
    fullName: "Full Name",
    class: "Class",
    gender: "Gender",
    age: "Age",
    weight: "Weight",
    height: "Height",
    bmi: "BMI",
    school: "School",
    actions: "Actions",
    bloodType: "Blood Type",
    tenSteps: "10-Step Exam",
    symptoms: "Symptoms",
    hearingTest: "Hearing Test",
    colorBlindness: "Color Vision",
    eyeTest: "Eye Test",
    visionBothEyes: "Vision (L/R)",
    flexibility: "Flexibility",
    handgripStrength: "Handgrip",
    standingKneeRaises: "Knee Raises",
    situps: "Sit-ups",
    pushups: "Push-ups",
    xRayResult: "X-Ray",
};

const ALL_COLUMNS_ORDER: ColKey[] = [...BASE_COLUMNS.slice(0, -1), ...HEALTH_COLUMNS, "actions"];

const LS_KEY = "students_visible_cols";

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
    const [genderFilter, setGenderFilter] = useState("");
    const [hearingFilter, setHearingFilter] = useState("");
    const [colorFilter, setColorFilter] = useState("");

    // Schools & column config
    const [schools, setSchools] = useState<School[]>([]);
    const [enabledHealthCols, setEnabledHealthCols] = useState<Set<ColKey>>(new Set(HEALTH_COLUMNS));
    const [visibleColumns, setVisibleColumns] = useState<Set<ColKey>>(new Set(ALL_COLUMNS_ORDER));
    const [colsReady, setColsReady] = useState(false);

    // Columns modal
    const [showColMenu, setShowColMenu] = useState(false);
    const colMenuRef = useRef<HTMLDivElement>(null);
    const colBtnRef = useRef<HTMLButtonElement>(null);

    const activeFilterCount = [classFilter, genderFilter, hearingFilter, colorFilter].filter(Boolean).length;

    // ── Fetch schools → compute enabled columns ──────────────────────────────
    useEffect(() => {
        fetch("/api/schools")
            .then(r => r.json())
            .then((data: School[]) => {
                setSchools(data);

                // Compute union of enabled testsConfig keys across relevant schools
                const relevantSchools = role === "SCHOOL_STAFF"
                    ? data.filter(s => s.id === userSchoolId)
                    : data;

                const unionEnabled = new Set<ColKey>();

                for (const school of relevantSchools) {
                    if (!school.testsConfig) {
                        // No config means all are enabled
                        HEALTH_COLUMNS.forEach(c => unionEnabled.add(c));
                        break;
                    }
                    for (const [key, enabled] of Object.entries(school.testsConfig)) {
                        if (enabled && TESTS_CONFIG_MAP[key]) {
                            unionEnabled.add(TESTS_CONFIG_MAP[key]);
                        }
                    }
                }

                setEnabledHealthCols(unionEnabled);

                // Load from localStorage or use enabled columns as default
                const defaultVisible = new Set<ColKey>([
                    ...BASE_COLUMNS,
                    ...Array.from(unionEnabled),
                ]);

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
        setClassFilter(""); setGenderFilter(""); setHearingFilter(""); setColorFilter("");
        setPage(1);
    };

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "15" });
        if (search) params.set("search", search);
        if (classFilter) params.set("class", classFilter);
        if (genderFilter) params.set("gender", genderFilter);
        if (hearingFilter) params.set("hearing", hearingFilter);
        if (colorFilter) params.set("colorBlindness", colorFilter);
        const res = await fetch(`/api/students?${params}`);
        const data = await res.json();
        setStudents(data.students || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, [page, search, classFilter, genderFilter, hearingFilter, colorFilter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    // ── Export ───────────────────────────────────────────────────────────────
    const exportExcel = async () => {
        const XLSX = await import("xlsx");
        const isEnabled = (col: ColKey) => enabledHealthCols.has(col);
        const rows = students.map(s => {
            const hr = s.healthRecords[0];
            const row: Record<string, any> = {
                [t("studentId")]: s.studentId,
                "Thai ID": s.thaiId || "",
                "Order No.": s.orderNumber,
                [t("class")]: s.class,
                [t("firstName")]: s.firstName,
                [t("lastName")]: s.surName,
                [t("gender")]: s.gender,
                "Age": (s as any).age ?? "",
                [t("school")]: s.school?.name,
                "Weight (kg)": hr?.weight ?? "",
                "Height (cm)": hr?.height ?? "",
                [t("bmi")]: hr?.bmi ?? "",
            };
            if (isEnabled("bloodType"))         row["Blood Type"]         = hr?.bloodType ?? "";
            if (isEnabled("hearingTest"))        row["Hearing Test"]       = hr?.hearingTest ?? "";
            if (isEnabled("colorBlindness"))     row["Color Vision"]       = hr?.colorBlindness ?? "";
            if (isEnabled("eyeTest"))            row["Eye Test"]           = hr?.eyeTest ?? "";
            if (isEnabled("visionBothEyes")) {
                row["Vision Left"]  = hr?.visionBothEyesLeft ?? "";
                row["Vision Right"] = hr?.visionBothEyesRight ?? "";
            }
            if (isEnabled("xRayResult"))         row["X-Ray Result"]      = hr?.xRayResult ?? "";
            if (isEnabled("flexibility"))        row["Flexibility"]        = hr?.flexibility ?? "";
            if (isEnabled("handgripStrength"))   row["Handgrip Strength"]  = hr?.handgripStrength ?? "";
            if (isEnabled("standingKneeRaises")) row["Knee Raises"]        = (hr as any)?.standingKneeRaises ?? "";
            if (isEnabled("situps"))             row["Sit-ups"]            = (hr as any)?.situps ?? "";
            if (isEnabled("pushups"))            row["Push-ups"]           = (hr as any)?.pushups ?? "";
            if (isEnabled("symptoms"))           row["Symptoms"]           = hr?.symptoms ?? "";
            if (isEnabled("tenSteps"))           row["10-Step Exam"]       = hr?.bodyExamination ?? "";
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
        setVisibleColumns(new Set([...BASE_COLUMNS, ...Array.from(enabledHealthCols)]));
    };

    // Ordered visible columns
    const orderedVisible = ALL_COLUMNS_ORDER.filter(k => visibleColumns.has(k));
    const colSpan = orderedVisible.length;

    // ── Cell renderer ────────────────────────────────────────────────────────
    const renderCell = (col: ColKey, s: Student) => {
        const hr = s.healthRecords[0];
        const bmi = hr?.bmi;
        const bmiColor = !bmi ? "" : bmi < 18.5 ? "text-blue-400" : bmi < 25 ? "text-green-400" : bmi < 30 ? "text-yellow-400" : "text-red-400";

        switch (col) {
            case "studentId":
                return <td key={col}><span className="font-mono text-xs text-muted-foreground">{s.studentId}</span></td>;
            case "thaiId":
                return <td key={col}><span className="font-mono text-xs text-muted-foreground">{s.thaiId || "—"}</span></td>;
            case "fullName":
                return (
                    <td key={col}>
                        <div>
                            <p className="font-medium">{s.firstName} {s.surName}</p>
                            <p className="text-xs text-muted-foreground">No. {s.orderNumber}</p>
                        </div>
                    </td>
                );
            case "class":
                return <td key={col}><span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{s.class}</span></td>;
            case "gender":
                return <td key={col}><span className={`text-xs ${s.gender === "Male" ? "text-blue-400" : "text-pink-400"}`}>{s.gender}</span></td>;
            case "age":
                return <td key={col}><span className="text-sm">{(s as any).age ?? "—"}</span></td>;
            case "weight":
                return <td key={col}><span className="text-sm">{hr?.weight ?? "—"}</span></td>;
            case "height":
                return <td key={col}><span className="text-sm">{hr?.height ?? "—"}</span></td>;
            case "bmi":
                return <td key={col}><span className={`font-semibold ${bmiColor}`}>{bmi ?? "—"}</span></td>;
            case "school":
                return <td key={col}><span className="text-xs text-muted-foreground truncate max-w-[150px] block">{s.school?.name}</span></td>;
            case "actions":
                return (
                    <td key={col}>
                        <Link href={`/dashboard/students/${s.id}`} className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm">
                            <Eye className="w-4 h-4" /> {t("view")}
                        </Link>
                    </td>
                );
            // Health columns
            case "bloodType":
                return <td key={col}><span className="text-xs">{hr?.bloodType || "—"}</span></td>;
            case "tenSteps":
                return <td key={col}><span className="text-xs truncate max-w-[120px] block">{hr?.bodyExamination || "—"}</span></td>;
            case "symptoms":
                return <td key={col}><span className="text-xs truncate max-w-[120px] block">{hr?.symptoms || "—"}</span></td>;
            case "hearingTest":
                return (
                    <td key={col}>
                        {hr ? (
                            <span className={hr.hearingTest?.toLowerCase().includes("normal") ? "badge-normal" : hr.hearingTest ? "badge-abnormal" : ""}>
                                {hr.hearingTest || "—"}
                            </span>
                        ) : "—"}
                    </td>
                );
            case "colorBlindness":
                return (
                    <td key={col}>
                        {hr ? (
                            <span className={hr.colorBlindness?.toLowerCase().includes("pass") || hr.colorBlindness?.toLowerCase().includes("normal") ? "badge-normal" : hr.colorBlindness ? "badge-abnormal" : ""}>
                                {hr.colorBlindness || "—"}
                            </span>
                        ) : "—"}
                    </td>
                );
            case "eyeTest":
                return <td key={col}><span className="text-xs">{hr?.eyeTest || "—"}</span></td>;
            case "visionBothEyes":
                return (
                    <td key={col}>
                        <span className="text-xs">
                            {hr ? `L: ${hr.visionBothEyesLeft || "—"} / R: ${hr.visionBothEyesRight || "—"}` : "—"}
                        </span>
                    </td>
                );
            case "flexibility":
                return <td key={col}><span className="text-sm">{hr?.flexibility ?? "—"}</span></td>;
            case "handgripStrength":
                return <td key={col}><span className="text-sm">{hr?.handgripStrength ?? "—"}</span></td>;
            case "standingKneeRaises":
                return <td key={col}><span className="text-sm">{(hr as any)?.standingKneeRaises ?? "—"}</span></td>;
            case "situps":
                return <td key={col}><span className="text-sm">{(hr as any)?.situps ?? "—"}</span></td>;
            case "pushups":
                return <td key={col}><span className="text-sm">{(hr as any)?.pushups ?? "—"}</span></td>;
            case "xRayResult":
                return <td key={col}><span className="text-xs truncate max-w-[100px] block">{hr?.xRayResult || "—"}</span></td>;
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

                    {/* Gender */}
                    <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">{t("gender")}: {t("all")}</option>
                        <option value="Male">{t("male")}</option>
                        <option value="Female">{t("female")}</option>
                    </select>

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
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Base Columns</p>
                                        <div className="grid grid-cols-2 gap-1 mb-4">
                                            {BASE_COLUMNS.map(key => (
                                                <label key={key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                                                    <input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleCol(key)} className="w-3.5 h-3.5 rounded accent-primary" />
                                                    <span className="text-sm text-foreground">{COL_LABELS[key]}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="border-t border-border/40 mb-3" />
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Health Assessment</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {HEALTH_COLUMNS.map(key => {
                                                const isEnabled = enabledHealthCols.has(key);
                                                return (
                                                    <label key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isEnabled ? "hover:bg-secondary" : "opacity-40"}`}>
                                                        <input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleCol(key)} className="w-3.5 h-3.5 rounded accent-primary" />
                                                        <span className="text-sm text-foreground flex-1">{COL_LABELS[key]}</span>
                                                        {!isEnabled && <span className="text-[10px] text-muted-foreground/60 shrink-0">off</span>}
                                                    </label>
                                                );
                                            })}
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
                                    <th key={col}>{COL_LABELS[col]}</th>
                                ))}
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
