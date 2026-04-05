"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export default function NewHealthRecordPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const preStudentId = searchParams.get("studentId") || "";

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [form, setForm] = useState({
        studentId: preStudentId,
        academicYear: new Date().getFullYear().toString(),
        underlyingDisease: "",
        drugAllergy: "",
        bloodType: "UNKNOWN",
        weight: "",
        height: "",
        hearingTest: "NORMAL",
        bodyExamination: "",
        visionPrescription: "",
        visionDistance: "20/20",
        visionResult: "ปกติ",
        colorBlindness: "NORMAL",
        xRayResult: "",
        doctorNote: "",
        additionalNotes: "",
    });

    useEffect(() => {
        fetch("/api/students?limit=200")
            .then(r => r.json())
            .then(d => setStudents(d.students || []));
    }, []);

    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const w = form.weight ? parseFloat(form.weight) : null;
        const h = form.height ? parseFloat(form.height) : null;
        let bmi: number | null = null;
        if (w && h) bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(2));

        const payload = {
            ...form,
            weight: w,
            height: h,
            bmi,
        };
        const res = await fetch("/api/health-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setLoading(false);
        if (res.ok) {
            setSaved(true);
            setTimeout(() => router.push(preStudentId ? `/dashboard/students/${preStudentId}` : "/dashboard/health-records"), 1500);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="page-title">{t("newHealthRecord")}</h1>
            </div>

            {saved && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    ✅ {t("healthRecordSavedSuccess")}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("students")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("selectStudent")} *</label>
                            <select required value={form.studentId} onChange={e => set("studentId", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                <option value="">— {t("chooseStudent")} —</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.surName} ({s.studentId}) — {s.class}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("year")}</label>
                            <input type="text" value={form.academicYear} onChange={e => set("academicYear", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                </div>

                {/* Measurements */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("physicalMeasurements")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("weight")}</label>
                            <input type="number" step="0.1" value={form.weight} placeholder="e.g. 45.5"
                                onChange={e => set("weight", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("height")}</label>
                            <input type="number" step="0.1" value={form.height} placeholder="e.g. 155"
                                onChange={e => set("height", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("bloodType")}</label>
                            <select value={form.bloodType} onChange={e => set("bloodType", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                {["A", "B", "AB", "O", "UNKNOWN"].map(bt => (
                                    <option key={bt} value={bt}>{bt === "UNKNOWN" ? t("unknown") : bt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Health Tests */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("healthTests")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: t("hearingTest"), key: "hearingTest" },
                            { label: t("colorBlindness"), key: "colorBlindness" },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium mb-1.5">{label}</label>
                                <div className="flex gap-3">
                                    {["NORMAL", "ABNORMAL"].map(v => (
                                        <label key={v} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all text-sm ${(form as any)[key] === v ? v === "NORMAL" ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400" : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                                            <input type="radio" name={key} value={v} checked={(form as any)[key] === v} onChange={() => set(key, v)} className="sr-only" />
                                            {t(v.toLowerCase() as any) || v}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("visionPrescription") || "Vision Details"}</label>
                            <input type="text" value={form.visionPrescription} placeholder="e.g. 20/20 or -1.50"
                                onChange={e => set("visionPrescription", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={form.visionDistance} placeholder="Distance (e.g. 20/50)"
                                    onChange={e => set("visionDistance", e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                <input type="text" value={form.visionResult} placeholder="Result (e.g. ปกติ)"
                                    onChange={e => set("visionResult", e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("xRayResult")}</label>
                            <input type="text" value={form.xRayResult} placeholder={t("normal")}
                                onChange={e => set("xRayResult", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                </div>

                {/* Medical History */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("medicalHistory")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: t("underlyingDisease"), key: "underlyingDisease", placeholder: t("underlyingDisease") },
                            { label: t("drugAllergy"), key: "drugAllergy", placeholder: t("drugAllergy") },
                            { label: t("bodyExaminationNotes") || "Body Examination", key: "bodyExamination", placeholder: t("normal") },
                            { label: "Doctor Note (พบแพทย์)", key: "doctorNote", placeholder: "Recommendations from doctor" },
                            { label: t("additionalNotes"), key: "additionalNotes", placeholder: t("notes") },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium mb-1.5">{label}</label>
                                <input type="text" value={(form as any)[key]} placeholder={placeholder}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-lg bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-all">
                        {t("cancel")}
                    </button>
                    <button type="submit" disabled={loading || saved}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-70 hover:opacity-90 transition-all"
                        style={{ background: "linear-gradient(135deg, hsl(150,60%,45%) 0%, hsl(25, 85%, 55%) 100%)" }}>
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("loading")}</> : <><Save className="w-5 h-5" /> {t("saveHealthRecord")}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
