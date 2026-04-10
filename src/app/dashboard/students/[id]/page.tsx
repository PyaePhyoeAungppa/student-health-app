"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Edit, Plus, Loader2, HeartPulse, Weight, Ruler, Eye, Ear, X, Save } from "lucide-react";
import Link from "next/link";
import { calculateAge, formatDate, getBMICategory } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export default function StudentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t, language } = useLanguage();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddRecord, setShowAddRecord] = useState(false);
    const [savingRecord, setSavingRecord] = useState(false);
    const [form, setForm] = useState({
        academicYear: new Date().getFullYear().toString(),
        underlyingDisease: "", drugAllergy: "", bloodType: "UNKNOWN",
        weight: "", height: "", hearingTest: "NORMAL", bodyExamination: "",
        visionPrescription: "", visionDistance: "20/20", visionResult: "ปกติ",
        colorBlindness: "NORMAL", xRayResult: "", doctorNote: "", additionalNotes: "",
    });

    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const fetchStudent = () => {
        fetch(`/api/students/${id}`)
            .then(r => r.json())
            .then(d => {
                setStudent(d);
                setLoading(false);
                // Pre-fill form with the latest health record if it exists
                const latest = d.healthRecords?.[0];
                if (latest) {
                    setForm({
                        academicYear: latest.academicYear || new Date().getFullYear().toString(),
                        underlyingDisease: latest.underlyingDisease || "",
                        drugAllergy: latest.drugAllergy || "",
                        bloodType: latest.bloodType || "UNKNOWN",
                        weight: latest.weight != null ? String(latest.weight) : "",
                        height: latest.height != null ? String(latest.height) : "",
                        hearingTest: latest.hearingTest || "NORMAL",
                        bodyExamination: latest.bodyExamination || "",
                        visionPrescription: latest.visionPrescription || "",
                        visionDistance: latest.visionDistance || "20/20",
                        visionResult: latest.visionResult || "ปกติ",
                        colorBlindness: latest.colorBlindness || "NORMAL",
                        xRayResult: latest.xRayResult || "",
                        doctorNote: latest.doctorNote || "",
                        additionalNotes: latest.additionalNotes || "",
                    });
                }
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchStudent();
    }, [id]);

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingRecord(true);
        const w = form.weight ? parseFloat(form.weight) : null;
        const h = form.height ? parseFloat(form.height) : null;
        let bmi: number | null = null;
        if (w && h) bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(2));

        const payload = { ...form, studentId: student.id, weight: w, height: h, bmi };
        
        const res = await fetch("/api/health-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        
        setSavingRecord(false);
        if (res.ok) {
            setShowAddRecord(false);
            setForm({
                academicYear: new Date().getFullYear().toString(),
                underlyingDisease: "", drugAllergy: "", bloodType: "UNKNOWN",
                weight: "", height: "", hearingTest: "NORMAL", bodyExamination: "",
                visionPrescription: "", visionDistance: "20/20", visionResult: "ปกติ",
                colorBlindness: "NORMAL", xRayResult: "", doctorNote: "", additionalNotes: "",
            });
            fetchStudent();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!student || student.error) return (
        <div className="text-center text-muted-foreground py-20">{t("studentNotFound")}</div>
    );

    const latestRecord = student.healthRecords?.[0];
    const bmiInfo = latestRecord?.bmi ? getBMICategory(latestRecord.bmi) : null;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="page-title">{student.firstName} {student.surName}</h1>
                    <p className="text-muted-foreground text-sm">{student.studentId} · {student.class} · {student.school?.name}</p>
                </div>
                {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                    <button onClick={() => setShowAddRecord(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all"
                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                        <Edit className="w-4 h-4" /> {latestRecord ? "Update Health Record" : t("addRecord")}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Student Info */}
                <div className="glass-card p-6 lg:col-span-1">
                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("studentInformation")}</h2>
                    <div className="space-y-3 text-sm">
                        {[
                            [t("studentId"), student.studentId],
                            [t("thaiId" as any), student.thaiId || "—"],
                            [t("fullName"), `${student.firstName} ${student.surName}`],
                            [t("gender"), t(student.gender.toLowerCase() as any) || student.gender],
                            [t("dob"), formatDate(student.dob, language)],
                            [t("age"), `${calculateAge(student.dob)} ${t("years")}`],
                            [t("class"), student.class],
                            [t("rosterNumber"), student.orderNumber],
                            [t("school"), student.school?.name],
                        ].map(([label, val]) => (
                            <div key={label.toString()} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium text-right">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Latest Health Stats */}
                <div className="lg:col-span-2 space-y-4">
                    {latestRecord ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { icon: Weight, label: t("weight"), value: `${latestRecord.weight} kg`, color: "hsl(212, 100%, 52%)" },
                                    { icon: Ruler, label: t("height"), value: `${latestRecord.height} cm`, color: "hsl(199, 89%, 48%)" },
                                    { icon: HeartPulse, label: t("bmi"), value: latestRecord.bmi, color: bmiInfo?.color.includes("green") ? "hsl(142,76%,45%)" : bmiInfo?.color.includes("blue") ? "hsl(212, 100%, 52%)" : bmiInfo?.color.includes("yellow") ? "hsl(38,92%,50%)" : "hsl(0,84%,60%)" },
                                    { icon: Eye, label: t("vision"), value: latestRecord.visionPrescription || "20/20", color: "hsl(290,70%,60%)" },
                                ].map(({ icon: Icon, label, value, color }) => (
                                    <div key={label} className="glass-card p-4 text-center">
                                        <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
                                        <p className="text-xl font-bold" style={{ color }}>{value}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                        {label === t("bmi") && bmiInfo && <p className="text-xs mt-1" style={{ color }}>{t(bmiInfo.key as any)}</p>}
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-6">
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("latestHealthRecord")}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    {[
                                        [t("bloodType"), latestRecord.bloodType],
                                        [t("underlyingDisease"), latestRecord.underlyingDisease || "—"],
                                        [t("drugAllergy"), latestRecord.drugAllergy || "—"],
                                        ["Doctor Note", latestRecord.doctorNote || "—"],
                                        [t("bodyExamination"), latestRecord.bodyExamination || "—"],
                                        [t("xRayResult"), latestRecord.xRayResult || "—"],
                                        [t("year"), latestRecord.academicYear || "—"],
                                    ].map(([label, val]) => (
                                        <div key={label.toString()} className="flex justify-between gap-2">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium">{val}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">{t("hearingTest")}</span>
                                        <span className={latestRecord.hearingTest === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(latestRecord.hearingTest?.toLowerCase() as any) || latestRecord.hearingTest || "—"}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">{t("colorBlindness")}</span>
                                        <span className={latestRecord.colorBlindness === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(latestRecord.colorBlindness?.toLowerCase() as any) || latestRecord.colorBlindness || "—"}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Vision Distance</span>
                                        <span className="font-medium">{latestRecord.visionDistance || "—"}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Vision Result</span>
                                        <span className="font-medium">{latestRecord.visionResult || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card p-12 text-center text-muted-foreground">
                            <HeartPulse className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>{t("noHealthRecords")}</p>
                            {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                                <button onClick={() => setShowAddRecord(true)} className="text-primary hover:underline text-sm mt-2 inline-block">
                                    {t("addFirstRecord")} →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* All Records History */}
            {student.healthRecords?.length > 1 && (
                <div className="glass-card p-6">
                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("recordHistory")}</h2>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t("year")}</th><th>{t("weight")}</th><th>{t("height")}</th><th>{t("bmi")}</th>
                                    <th>{t("hearing")}</th><th>{t("colorBlindness")}</th><th>{t("vision")}</th><th>{t("date")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.healthRecords.map((r: any) => (
                                    <tr key={r.id}>
                                        <td>{r.academicYear || "—"}</td>
                                        <td>{r.weight ?? "—"} kg</td>
                                        <td>{r.height ?? "—"} cm</td>
                                        <td className={r.bmi ? getBMICategory(r.bmi).color : ""}>{r.bmi ?? "—"}</td>
                                        <td><span className={r.hearingTest === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(r.hearingTest?.toLowerCase() as any) || r.hearingTest || "—"}</span></td>
                                        <td><span className={r.colorBlindness === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{t(r.colorBlindness?.toLowerCase() as any) || r.colorBlindness || "—"}</span></td>
                                        <td>{r.visionPrescription || "—"}</td>
                                        <td className="text-muted-foreground text-xs">{formatDate(r.recordedAt, language)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Record Modal */}
            {showAddRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-border/50 relative">
                        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 p-6 border-b border-border/30 flex items-center justify-between">
                            <h2 className="font-semibold text-lg">
                            {latestRecord ? "Update Health Record" : t("newHealthRecord")} — {student.firstName}
                        </h2>
                            <button onClick={() => setShowAddRecord(false)} className="p-2 text-muted-foreground hover:bg-secondary rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSaveRecord} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t("year")}</label>
                                        <input type="text" value={form.academicYear} onChange={e => set("academicYear", e.target.value)} required
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
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t("weight")} (kg)</label>
                                        <input type="number" step="0.1" value={form.weight} placeholder="e.g. 45.5" onChange={e => set("weight", e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t("height")} (cm)</label>
                                        <input type="number" step="0.1" value={form.height} placeholder="e.g. 155" onChange={e => set("height", e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: t("hearingTest"), key: "hearingTest" },
                                        { label: t("colorBlindness"), key: "colorBlindness" },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium mb-1.5">{label}</label>
                                            <div className="flex gap-2">
                                                {["NORMAL", "ABNORMAL"].map(v => (
                                                    <label key={v} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${(form as any)[key] === v ? v === "NORMAL" ? "bg-green-500/15 border-green-500/30 text-green-600" : "bg-red-500/15 border-red-500/30 text-red-600" : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                                                        <input type="radio" name={key} value={v} checked={(form as any)[key] === v} onChange={() => set(key, v)} className="sr-only" />
                                                        {t(v.toLowerCase() as any) || v}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t("visionPrescription") || "Vision"}</label>
                                        <input type="text" value={form.visionPrescription} placeholder="e.g. 20/20" onChange={e => set("visionPrescription", e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" value={form.visionDistance} placeholder="Distance" onChange={e => set("visionDistance", e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                            <input type="text" value={form.visionResult} placeholder="Result" onChange={e => set("visionResult", e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t("xRayResult")}</label>
                                        <input type="text" value={form.xRayResult} placeholder="e.g. Normal" onChange={e => set("xRayResult", e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: t("underlyingDisease"), key: "underlyingDisease" },
                                        { label: t("drugAllergy"), key: "drugAllergy" },
                                        { label: "Body Examination", key: "bodyExamination" },
                                        { label: "Doctor Note", key: "doctorNote" },
                                        { label: t("additionalNotes"), key: "additionalNotes" },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium mb-1.5">{label}</label>
                                            <input type="text" value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                                    <button type="button" onClick={() => setShowAddRecord(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">{t("cancel")}</button>
                                    <button type="submit" disabled={savingRecord} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                                        {savingRecord ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}</> : <><Save className="w-4 h-4" /> {t("saveHealthRecord")}</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
