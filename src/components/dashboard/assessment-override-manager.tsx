"use client";
import { useEffect, useState, useCallback } from "react";
import { Download, Edit2, Save, RotateCcw, CheckCircle2, AlertCircle, Loader2, Upload, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
export interface StudentAssessment {
    studentId: string;
    name: string;
    class: string;
    gender: string;
    ageMonths: number;
    ageYears: number;
    weight: string | number;
    height: string | number;
    waLabel: string;
    haLabel: string;
    whLabel: string;
    overridden?: boolean;
}

interface Props {
    schoolId: string;
    calculatedData?: StudentAssessment[];
}

/* ------------------------------------------------------------------ */
/*  Label option sets                                                   */
/* ------------------------------------------------------------------ */
const WA_OPTIONS = [
    "น้ำหนักมากกว่าเกณฑ์",
    "น้ำหนักค่อนข้างมาก",
    "น้ำหนักตามเกณฑ์",
    "น้ำหนักค่อนข้างน้อย",
    "น้ำหนักน้อยกว่าเกณฑ์",
    "—",
];
const HA_OPTIONS = [
    "สูงกว่าเกณฑ์",
    "ค่อนข้างสูง",
    "ส่วนสูงตามเกณฑ์",
    "ค่อนข้างเตี้ย",
    "เตี้ย",
    "—",
];
const WH_OPTIONS = [
    "อ้วน",
    "เริ่มอ้วน",
    "ท้วม",
    "สมส่วน",
    "ค่อนข้างผอม",
    "ผอม",
    "—",
];

const WA_EN: Record<string, string> = {
    "น้ำหนักมากกว่าเกณฑ์": "Above Standard Weight",
    "น้ำหนักค่อนข้างมาก": "Relatively High Weight",
    "น้ำหนักตามเกณฑ์": "Weight Within Standard",
    "น้ำหนักค่อนข้างน้อย": "Relatively Low Weight",
    "น้ำหนักน้อยกว่าเกณฑ์": "Below Standard Weight",
};
const HA_EN: Record<string, string> = {
    "สูงกว่าเกณฑ์": "Above Standard Height",
    "ค่อนข้างสูง": "Relatively Tall",
    "ส่วนสูงตามเกณฑ์": "Standard Height",
    "ค่อนข้างเตี้ย": "Relatively Short",
    "เตี้ย": "Short",
};
const WH_EN: Record<string, string> = {
    "อ้วน": "Obese",
    "เริ่มอ้วน": "Overweight",
    "ท้วม": "Plump",
    "สมส่วน": "Proportionate",
    "ค่อนข้างผอม": "Relatively Thin",
    "ผอม": "Thin",
};

/* color helpers */
function waColor(l: string) {
    if (l === "น้ำหนักน้อยกว่าเกณฑ์") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (l === "น้ำหนักค่อนข้างน้อย") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    if (l === "น้ำหนักตามเกณฑ์") return "bg-green-500/10 text-green-400 border-green-500/30";
    if (l === "น้ำหนักค่อนข้างมาก") return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    if (l === "น้ำหนักมากกว่าเกณฑ์") return "bg-red-500/10 text-red-400 border-red-500/30";
    return "bg-muted/30 text-muted-foreground border-border";
}
function haColor(l: string) {
    if (l === "เตี้ย") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (l === "ค่อนข้างเตี้ย") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    if (l === "ส่วนสูงตามเกณฑ์") return "bg-green-500/10 text-green-400 border-green-500/30";
    if (l === "ค่อนข้างสูง") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    if (l === "สูงกว่าเกณฑ์") return "bg-red-500/10 text-red-400 border-red-500/30";
    return "bg-muted/30 text-muted-foreground border-border";
}
function whColor(l: string) {
    if (l === "ผอม") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (l === "ค่อนข้างผอม") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    if (l === "สมส่วน") return "bg-green-500/10 text-green-400 border-green-500/30";
    if (l === "ท้วม" || l === "เริ่มอ้วน") return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    if (l === "อ้วน") return "bg-red-500/10 text-red-400 border-red-500/30";
    return "bg-muted/30 text-muted-foreground border-border";
}

function LabelSelect({ value, options, colorFn, onChange, enMap }: {
    value: string; options: string[]; colorFn: (v: string) => string;
    onChange: (v: string) => void; enMap: Record<string, string>;
}) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            className={`w-full text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-colors ${colorFn(value)}`}
            style={{ background: "transparent" }}>
            {options.map(o => (
                <option key={o} value={o} style={{ background: "hsl(222,47%,11%)", color: "#e2e8f0" }}>
                    {o}{enMap[o] ? ` — ${enMap[o]}` : ""}
                </option>
            ))}
        </select>
    );
}

export function AssessmentOverrideManager({ schoolId, calculatedData = [] }: Props) {
    const [saved, setSaved] = useState<StudentAssessment[]>([]);
    const [rows, setRows] = useState<StudentAssessment[]>([]);
    const [importedAt, setImportedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [filter, setFilter] = useState("");
    const [dirty, setDirty] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/schools/${schoolId}/assessments`);
            const data = await res.json();
            setSaved(data.assessments ?? []);
            setRows(data.assessments ?? []);
            setImportedAt(data.importedAt ?? null);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [schoolId]);

    useEffect(() => { load(); }, [load]);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const handleImport = () => {
        if (calculatedData.length === 0) {
            showToast("error", "No calculated data available. Please view the Growth Assessment Table tab first.");
            return;
        }
        const merged = calculatedData.map(c => {
            const ex = saved.find(s => s.studentId === c.studentId);
            return ex ? { ...c, waLabel: ex.waLabel, haLabel: ex.haLabel, whLabel: ex.whLabel, overridden: ex.overridden } : { ...c, overridden: false };
        });
        setRows(merged);
        setEditMode(true);
        setDirty(true);
        showToast("success", `Imported ${merged.length} student records. Edit and save when ready.`);
    };

    const updateRow = (studentId: string, field: keyof StudentAssessment, value: string) => {
        setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, [field]: value, overridden: true } : r));
        setDirty(true);
    };

    const resetRow = (studentId: string) => {
        const calc = calculatedData.find(c => c.studentId === studentId);
        if (!calc) return;
        setRows(prev => prev.map(r => r.studentId === studentId ? { ...calc, overridden: false } : r));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/schools/${schoolId}/assessments`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessments: rows }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSaved([...rows]);
            setImportedAt(new Date().toISOString());
            setDirty(false);
            showToast("success", `Saved ${data.count} records successfully.`);
        } catch { showToast("error", "Failed to save. Please try again."); }
        finally { setSaving(false); }
    };

    const handleDiscard = () => { setRows([...saved]); setEditMode(false); setDirty(false); };

    const filtered = rows.filter(r => !filter || r.name.toLowerCase().includes(filter.toLowerCase()) || (r.class || "").toLowerCase().includes(filter.toLowerCase()));
    const overriddenCount = rows.filter(r => r.overridden).length;

    return (
        <div className="glass-card overflow-hidden relative">
            {toast && (
                <div className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-red-500/20 border border-red-500/30 text-red-400"}`}>
                    {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="p-5 border-b border-border space-y-3">
                {/* Title row */}
                <div>
                    <h2 className="font-semibold text-base">Assessment Override Manager</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Import auto-calculated results, edit any assessment, then save.
                        {importedAt && <span className="ml-2 text-primary/70">Last saved: {new Date(importedAt).toLocaleString()}</span>}
                    </p>
                </div>
                {/* Action buttons row — wraps on small screens */}
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleImport} disabled={calculatedData.length === 0}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Import Calculated Data ({calculatedData.length})
                    </button>
                    {rows.length > 0 && !editMode && (
                        <button onClick={() => setEditMode(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Assessments
                        </button>
                    )}
                    {editMode && (
                        <>
                                <button onClick={handleDiscard}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary border border-border hover:bg-secondary/80 transition-colors">
                                    <X className="w-3.5 h-3.5" /> Discard
                                </button>
                                <button onClick={handleSave} disabled={saving || !dirty}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    {saving ? "Saving…" : "Save All Changes"}
                                </button>
                            </>
                        )}
                    </div>
                {rows.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{rows.length} students</span>
                        {overriddenCount > 0 && <span className="text-orange-400">{overriddenCount} manually overridden</span>}
                        {dirty && editMode && <span className="text-yellow-400 font-medium animate-pulse">● Unsaved changes</span>}
                        <input type="text" placeholder="Filter by name or class…" value={filter} onChange={e => setFilter(e.target.value)}
                            className="ml-auto bg-secondary/50 border border-border rounded-md px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48" />
                    </div>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 gap-3 text-muted-foreground">
                    <Download className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium">No assessment data yet</p>
                    <p className="text-xs max-w-xs text-center">
                        Open the <strong>Growth Assessment Table</strong> tab to calculate results, then click <strong>Import Calculated Data</strong> above.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
                                <th className="px-3 py-2.5 font-semibold w-8">#</th>
                                <th className="px-3 py-2.5 font-semibold">Name</th>
                                <th className="px-3 py-2.5 font-semibold text-center">Class</th>
                                <th className="px-3 py-2.5 font-semibold text-center">Sex</th>
                                <th className="px-3 py-2.5 font-semibold text-center">Age</th>
                                <th className="px-3 py-2.5 font-semibold text-center">Wt(kg)</th>
                                <th className="px-3 py-2.5 font-semibold text-center">Ht(cm)</th>
                                <th className="px-3 py-2.5 font-semibold min-w-[175px]">น้ำหนักตามเกณฑ์อายุ — W/A</th>
                                <th className="px-3 py-2.5 font-semibold min-w-[175px]">ส่วนสูงตามเกณฑ์อายุ — H/A</th>
                                <th className="px-3 py-2.5 font-semibold min-w-[175px]">น้ำหนักตามเกณฑ์ส่วนสูง — W/H</th>
                                {editMode && <th className="px-3 py-2.5 font-semibold text-center w-10">↺</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((row, i) => (
                                <tr key={row.studentId} className={`hover:bg-secondary/10 transition-colors ${row.overridden ? "bg-orange-500/5" : ""}`}>
                                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                    <td className="px-3 py-2 font-medium max-w-[190px]">
                                        <span className="block truncate" title={row.name}>{row.name}</span>
                                        {row.overridden && <span className="text-[10px] text-orange-400">✎ edited</span>}
                                    </td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">{row.class || "—"}</td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">{row.gender === "Male" ? "♂" : "♀"}</td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">{row.ageYears}y</td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">{row.weight}</td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">{row.height}</td>
                                    <td className="px-3 py-1.5">
                                        {editMode ? (
                                            <LabelSelect value={row.waLabel} options={WA_OPTIONS} colorFn={waColor} enMap={WA_EN} onChange={v => updateRow(row.studentId, "waLabel", v)} />
                                        ) : (
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${waColor(row.waLabel)}`}>{row.waLabel || "—"}</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        {editMode ? (
                                            <LabelSelect value={row.haLabel} options={HA_OPTIONS} colorFn={haColor} enMap={HA_EN} onChange={v => updateRow(row.studentId, "haLabel", v)} />
                                        ) : (
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${haColor(row.haLabel)}`}>{row.haLabel || "—"}</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        {editMode ? (
                                            <LabelSelect value={row.whLabel} options={WH_OPTIONS} colorFn={whColor} enMap={WH_EN} onChange={v => updateRow(row.studentId, "whLabel", v)} />
                                        ) : (
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${whColor(row.whLabel)}`}>{row.whLabel || "—"}</span>
                                        )}
                                    </td>
                                    {editMode && (
                                        <td className="px-3 py-1.5 text-center">
                                            {row.overridden && (
                                                <button onClick={() => resetRow(row.studentId)} title="Reset to calculated value"
                                                    className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                                                    <RotateCcw className="w-3 h-3" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No results match your filter.</div>}
                </div>
            )}

            {/* Footer */}
            {editMode && rows.length > 0 && (
                <div className="p-4 border-t border-border flex items-center justify-between gap-4 bg-secondary/10">
                    <p className="text-xs text-muted-foreground">
                        <strong className="text-orange-400">{overriddenCount}</strong> of {rows.length} rows manually edited. Use ↺ to restore a calculated value.
                    </p>
                    <button onClick={handleSave} disabled={saving || !dirty}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving…" : "Save All Changes"}
                    </button>
                </div>
            )}
        </div>
    );
}
