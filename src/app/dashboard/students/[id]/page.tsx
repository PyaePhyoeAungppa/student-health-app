"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Edit, Plus, Loader2, HeartPulse, Weight, Ruler, Eye, Ear, X, Save, Check } from "lucide-react";
import Link from "next/link";
import { formatDate, getBMICategory } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export default function StudentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t, language } = useLanguage();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const [student, setStudent] = useState<any>(null);
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddRecord, setShowAddRecord] = useState(false);
    const [savingRecord, setSavingRecord] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [form, setForm] = useState({
        academicYear: new Date().getFullYear().toString(),
        underlyingDisease: "", drugAllergy: "", bloodType: "-",
        weight: "", height: "", hearingTest: "-",
        colorBlindness: "-", xRayResult: "-", xRayResultDescription: "",
        eyeTest: "-",
        visualAcuity: "-",
        symptoms: "-",
        flexibility: "",
        handgripStrength: "",
        standingKneeRaises: "",
        situps: "",
        pushups: "",
        cbc: "",
        fbs: "",
        cholesterol: "",
        hbsag: "",
        ua: "",
        amphetamine: "",
        customData: {} as Record<string, any>,
    });

    const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
    const toggleArrayItem = (key: string, value: string) => {
        setForm(prev => {
            const arr = (prev as any)[key] as string[];
            if (arr?.includes(value)) return { ...prev, [key]: arr.filter(v => v !== value) };
            return { ...prev, [key]: [...(arr || []), value] };
        });
    };

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
                        academicYear: new Date().getFullYear().toString(),
                        underlyingDisease: latest.underlyingDisease || "",
                        drugAllergy: latest.drugAllergy || "",
                        bloodType: latest.bloodType || "-",
                        weight: latest.weight != null ? String(latest.weight) : "",
                        height: latest.height != null ? String(latest.height) : "",
                        hearingTest: latest.hearingTest || "-",
                        colorBlindness: latest.colorBlindness || "-",
                        xRayResult: latest.xRayResult || "-",
                        xRayResultDescription: latest.xRayResultDescription || "",
                        eyeTest: latest.eyeTest || "-",
                        visualAcuity: latest.visualAcuity || "-",
                        symptoms: latest.symptoms || "-",
                        flexibility: latest.flexibility != null ? String(latest.flexibility) : "",
                        handgripStrength: latest.handgripStrength != null ? String(latest.handgripStrength) : "",
                        standingKneeRaises: latest.standingKneeRaises != null ? String(latest.standingKneeRaises) : "",
                        situps: latest.situps != null ? String(latest.situps) : "",
                        pushups: latest.pushups != null ? String(latest.pushups) : "",
                        cbc: latest.cbc || "",
                        fbs: latest.fbs || "",
                        cholesterol: latest.cholesterol || "",
                        hbsag: latest.hbsag || "",
                        ua: latest.ua || "",
                        amphetamine: latest.amphetamine || "",
                        customData: latest.customData || {},
                    });
                }
                
                if (d.school?.customFields) {
                    setCustomFields(d.school.customFields);
                }
            })
            .catch(() => setLoading(false));
    };

    const executeResetPassword = async () => {
        setResettingPassword(true);
        try {
            const res = await fetch(`/api/students/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passwordHash: null }),
            });
            if (res.ok) {
                fetchStudent();
                setShowResetConfirm(false);
                setToastMessage(t("passwordResetSuccess" as any));
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                alert("Failed to reset password.");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            alert("An error occurred while resetting the password.");
        } finally {
            setResettingPassword(false);
        }
    };

    useEffect(() => {
        fetchStudent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingRecord(true);
        const w = form.weight ? parseFloat(form.weight) : null;
        const h = form.height ? parseFloat(form.height) : null;
        let bmi: number | null = null;
        if (w && h) bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(2));

        const flex = form.flexibility ? parseFloat(form.flexibility) : null;
        const grip = form.handgripStrength ? parseFloat(form.handgripStrength) : null;
        const knee = form.standingKneeRaises ? parseInt(form.standingKneeRaises) : null;
        const sit = form.situps ? parseInt(form.situps) : null;
        const push = form.pushups ? parseInt(form.pushups) : null;
        
        const payload = { ...form, studentId: student.id, weight: w, height: h, bmi, flexibility: flex, handgripStrength: grip, standingKneeRaises: knee, situps: sit, pushups: push, customData: form.customData };
        
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
                underlyingDisease: "", drugAllergy: "", bloodType: "-",
                weight: "", height: "", hearingTest: "-",
                colorBlindness: "-", xRayResult: "-", xRayResultDescription: "",
                eyeTest: "-", visualAcuity: "-", symptoms: "-",
                flexibility: "", handgripStrength: "", standingKneeRaises: "", situps: "", pushups: "",
                cbc: "", fbs: "", cholesterol: "", hbsag: "", ua: "", amphetamine: "", customData: {},
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

    const optionalKeys = ["gender", "handgripStrength", "standingKneeRaises", "situps", "pushups", "xRayResult"];
    const isTestEnabled = (key: string) => {
        if (!optionalKeys.includes(key)) return true;
        return student?.school?.testsConfig ? student.school.testsConfig[key] !== false : true;
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="page-title">{student.prefix || ""} {student.firstName} {student.surName}</h1>
                    <p className="text-muted-foreground text-sm">{student.studentId} · {student.class}{student.room ? `/${student.room}` : ""} · {student.school?.name}</p>
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
                            [t("fullName"), `${student.prefix || ""} ${student.firstName} ${student.surName}`.trim()],
                            [t("gender"), student.gender || "—"],
                            [t("age"), student.age != null ? `${student.age} ${t("years")}` : "—"],
                            [t("class"), student.class],
                            [t("room"), student.room || "—"],
                            [t("rosterNumber"), student.orderNumber],
                            [t("school"), student.school?.name],
                        ].map(([label, val]) => (
                            <div key={label.toString()} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium text-right">{val}</span>
                            </div>
                        ))}

                        {/* Password Status & Reset */}
                        <div className="border-t border-border/50 pt-3 mt-3 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{t("passwordStatus" as any)}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${student.passwordHash ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"}`}>
                                    {student.passwordHash ? t("passwordSet" as any) : t("passwordNotSet" as any)}
                                </span>
                            </div>

                            {student.passwordHash && (role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    disabled={resettingPassword}
                                    className="w-full mt-2 py-2 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {resettingPassword ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        t("resetPassword" as any)
                                    )}
                                </button>
                            )}
                        </div>
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
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">{t("latestHealthRecord")}</h2>
                                
                                <div className="space-y-6">
                                    {/* General Details */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">General Details</h3>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                [t("year"), latestRecord.academicYear || "—"],
                                                [t("underlyingDisease"), latestRecord.underlyingDisease || t("none")],
                                                [t("drugAllergy"), latestRecord.drugAllergy || t("none")],
                                                [t("bloodType"), latestRecord.bloodType || "-"],
                                                [t("weight"), latestRecord.weight != null ? `${latestRecord.weight} kg` : "N/A"],
                                                [t("height"), latestRecord.height != null ? `${latestRecord.height} cm` : "N/A"],
                                                [t("symptoms"), latestRecord.symptoms || "N/A"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                    <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                                                    <span className="font-medium text-right">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Vision & Hearing */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">Vision & Hearing</h3>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                [t("hearingTest"), latestRecord.hearingTest || "N/A"],
                                                [t("eyeTest"), latestRecord.eyeTest || "N/A"],
                                                [t("visualAcuity"), latestRecord.visualAcuity || "N/A"],
                                                [t("colorBlindness"), latestRecord.colorBlindness || "N/A"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                    <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                                                    <span className="font-medium text-right">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Physical Fitness Tests */}
                                    {isTestEnabled("flexibility") || isTestEnabled("handgripStrength") || isTestEnabled("standingKneeRaises") || isTestEnabled("situps") || isTestEnabled("pushups") ? (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">Physical Fitness Tests</h3>
                                            <div className="grid grid-cols-1 gap-y-3 text-sm">
                                                {[
                                                    isTestEnabled("flexibility") ? [t("flexibility"), latestRecord.flexibility != null ? `${latestRecord.flexibility} cm` : "N/A"] : null,
                                                    isTestEnabled("handgripStrength") ? [t("handgripStrength"), latestRecord.handgripStrength != null ? `${latestRecord.handgripStrength}` : "N/A"] : null,
                                                    isTestEnabled("standingKneeRaises") ? [t("standingKneeRaises"), latestRecord.standingKneeRaises != null ? `${latestRecord.standingKneeRaises}` : "N/A"] : null,
                                                    isTestEnabled("situps") ? [t("situps"), latestRecord.situps != null ? `${latestRecord.situps}` : "N/A"] : null,
                                                    isTestEnabled("pushups") ? [t("pushups"), latestRecord.pushups != null ? `${latestRecord.pushups}` : "N/A"] : null,
                                                ].filter(Boolean).map((item: any) => (
                                                    <div key={item[0].toString()} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                        <span className="text-muted-foreground whitespace-nowrap">{item[0]}</span>
                                                        <span className="font-medium text-right">{item[1]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* X-Ray */}
                                    {isTestEnabled("xRayResult") && (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">X-Ray</h3>
                                            <div className="grid grid-cols-1 gap-y-3 text-sm">
                                                <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                    <span className="text-muted-foreground whitespace-nowrap">{t("xRayResult")}</span>
                                                    <span className="font-medium text-right">
                                                        {latestRecord.xRayResult === "Abnormal" && latestRecord.xRayResultDescription 
                                                            ? `${latestRecord.xRayResult} (${latestRecord.xRayResultDescription})` 
                                                            : latestRecord.xRayResult || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Laboratory Test Results */}
                                    {(student?.school?.testsConfig?.cbc !== false || student?.school?.testsConfig?.fbs !== false || student?.school?.testsConfig?.cholesterol !== false || student?.school?.testsConfig?.hbsag !== false || student?.school?.testsConfig?.ua !== false || student?.school?.testsConfig?.amphetamine !== false) && (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">Laboratory Test Results</h3>
                                            <div className="grid grid-cols-1 gap-y-3 text-sm">
                                                {[
                                                    student?.school?.testsConfig?.cbc !== false ? ["ความสมบูรณ์ของเม็ดเลือด (CBC)", latestRecord.cbc || "N/A"] : null,
                                                    student?.school?.testsConfig?.fbs !== false ? ["ระดับน้ำตาลในเลือด (FBS)", latestRecord.fbs || "N/A"] : null,
                                                    student?.school?.testsConfig?.cholesterol !== false ? ["ระดับไขมันในเลือด (Cholesterol)", latestRecord.cholesterol || "N/A"] : null,
                                                    student?.school?.testsConfig?.hbsag !== false ? ["ตรวจหาเชื้อไวรัสตับอักเสบบี (HBSAG)", latestRecord.hbsag || "N/A"] : null,
                                                    student?.school?.testsConfig?.ua !== false ? ["ตรวจปัสสาวะทั่วไป (UA)", latestRecord.ua || "N/A"] : null,
                                                    student?.school?.testsConfig?.amphetamine !== false ? ["ตรวจหาสารเสพติดในปัสสาวะ (Amphetamine)", latestRecord.amphetamine || "N/A"] : null,
                                                ].filter(Boolean).map((item: any) => (
                                                    <div key={item[0].toString()} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                        <span className="text-muted-foreground whitespace-nowrap">{item[0]}</span>
                                                        <span className="font-medium text-right">{item[1]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Custom Fields Display */}
                                    {customFields.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2 pt-4">Custom Fields</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                                {customFields.map(field => {
                                                    const val = latestRecord.customData?.[field.id];
                                                    const desc = latestRecord.customData?.[`${field.id}_desc`];
                                                    return (
                                                        <div key={field.id} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                            <span className="text-muted-foreground whitespace-nowrap">{field.label}</span>
                                                            <span className="font-medium text-right">
                                                                {val ? String(val) : "N/A"}
                                                                {desc && <span className="block text-xs text-muted-foreground font-normal">{desc}</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
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
            {false && student.healthRecords?.length > 1 && (
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
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="min-h-full flex items-start justify-center p-4 sm:p-8 pt-8 sm:pt-12">
                        <div className="bg-background w-full max-w-[95vw] lg:max-w-7xl rounded-2xl shadow-2xl border border-border/50 relative mb-12">
                            <div className="sticky top-0 bg-background/95 backdrop-blur z-20 p-5 sm:p-6 border-b border-border/30 flex items-center justify-between rounded-t-2xl">
                                <h2 className="font-semibold text-lg">
                                    {latestRecord ? "Update Health Record" : t("newHealthRecord")} — {student.firstName}
                                </h2>
                                <button type="button" onClick={() => setShowAddRecord(false)} className="p-2 text-muted-foreground hover:bg-secondary rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 sm:p-6">
                                <form onSubmit={handleSaveRecord} className="space-y-6">
                                    {/* Year is hidden and managed automatically */}
                                    <input type="hidden" value={form.academicYear} name="academicYear" />
                                    {/* General Details */}
                                    <div>
                                        <h3 className="font-semibold text-primary mb-4 border-b pb-2">General Details</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">{t("underlyingDisease")}</label>
                                                <input type="text" value={form.underlyingDisease} onChange={e => set("underlyingDisease", e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">{t("drugAllergy")}</label>
                                                <input type="text" value={form.drugAllergy} onChange={e => set("drugAllergy", e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                            </div>
                                            {isTestEnabled("bloodType") && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5 font-bold text-primary">{t("bloodType")}</label>
                                                    <select value={form.bloodType || "-"} onChange={e => set("bloodType", e.target.value)}
                                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="AB">AB</option>
                                                        <option value="O">O</option>
                                                    </select>
                                                </div>
                                            )}
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
                                            {isTestEnabled("symptoms") && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5">Symptoms / Health อาการเจ็บป่วยเบื้องต้น</label>
                                                    <select value={form.symptoms} onChange={e => set("symptoms", e.target.value)} className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="Normal ปกติ">Normal ปกติ</option>
                                                        <option value="Abnormal ไม่ปกติ">Abnormal ไม่ปกติ</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Vision & Hearing */}
                                    <div>
                                        <h3 className="font-semibold text-primary mb-4 border-b pb-2 pt-4">Vision & Hearing</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {isTestEnabled("hearingTest") && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5">Hearing Test การได้ยิน</label>
                                                    <select value={form.hearingTest} onChange={e => set("hearingTest", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="Normal ปกติ">Normal ปกติ</option>
                                                        <option value="Abnormal ผิดปกติ (Right ear หูขวา)">Abnormal ผิดปกติ (Right หูขวา)</option>
                                                        <option value="Abnormal ผิดปกติ (Left ear หูซ้าย)">Abnormal ผิดปกติ (Left หูซ้าย)</option>
                                                        <option value="Abnormal ผิดปกติ (Both side ทั้งสองข้าง)">Abnormal ผิดปกติ (Both ทั้งสองข้าง)</option>
                                                    </select>
                                                </div>
                                            )}
                                            {isTestEnabled("eyeTest") && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5">Vision Range การทดสอบสายตา</label>
                                                    <select value={form.eyeTest} onChange={e => set("eyeTest", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="Have glasses มีแว่นตา">Have glasses มีแว่นตา</option>
                                                        <option value="No Glasses ตาเปล่า">No Glasses ตาเปล่า</option>
                                                        <option value="Didn't bring the glasssไม่ นำแว่นมา">Didn&apos;t bring the glasssไม่ นำแว่นมา</option>
                                                        <option value="Blindness เสียการมองเห็น (ตาบอด)">Blindness เสียการมองเห็น (ตาบอด)</option>
                                                    </select>
                                                </div>
                                            )}
                                            {isTestEnabled("eyeTest") && form.eyeTest !== "Blindness เสียการมองเห็น (ตาบอด)" && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5">{t("visualAcuity")} ระยะการมอง</label>
                                                    <select value={form.visualAcuity} onChange={e => set("visualAcuity", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="20/20">20/20</option>
                                                        <option value="20/30">20/30</option>
                                                        <option value="20/50">20/50</option>
                                                        <option value="20/100">20/100</option>
                                                        <option value="20/200">20/200</option>
                                                    </select>
                                                </div>
                                            )}
                                            {isTestEnabled("colorBlindness") && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5">Color Blindness ตาบอดสี</label>
                                                    <select value={form.colorBlindness} onChange={e => set("colorBlindness", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="Pass ผ่าน">Pass ผ่าน</option>
                                                        <option value="Not pass ไม่ผ่าน">Not pass ไม่ผ่าน</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Physical Fitness Tests */}
                                    {(isTestEnabled("flexibility") || isTestEnabled("handgripStrength") || isTestEnabled("standingKneeRaises") || isTestEnabled("situps") || isTestEnabled("pushups")) && (
                                        <div>
                                            <h3 className="font-semibold text-primary mb-4 border-b pb-2 pt-4">Physical Fitness Tests</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                                {isTestEnabled("flexibility") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">Flexibility (cm)</label>
                                                        <input type="number" step="0.1" min="-30" max="30" value={form.flexibility} placeholder="-30 to 30 cm" onChange={e => set("flexibility", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("handgripStrength") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">Handgrip (kg)</label>
                                                        <input type="number" step="0.1" min="0" max="50" value={form.handgripStrength} placeholder="0-50" onChange={e => set("handgripStrength", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("standingKneeRaises") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">Knee Raises</label>
                                                        <input type="number" step="1" min="0" value={form.standingKneeRaises} placeholder="Times" onChange={e => set("standingKneeRaises", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("situps") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">Sit-ups</label>
                                                        <input type="number" step="1" min="0" value={form.situps} placeholder="Times" onChange={e => set("situps", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("pushups") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">Push-ups</label>
                                                        <input type="number" step="1" min="0" value={form.pushups} placeholder="Times" onChange={e => set("pushups", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* X-Ray */}
                                    {isTestEnabled("xRayResult") && (
                                        <div>
                                            <h3 className="font-semibold text-primary mb-4 border-b pb-2 pt-4">X-Ray</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1.5">X-Ray Result</label>
                                                    <select value={form.xRayResult} onChange={e => {
                                                        set("xRayResult", e.target.value);
                                                        if (e.target.value !== "Abnormal") {
                                                            set("xRayResultDescription", "");
                                                        }
                                                    }} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                        <option value="-">-</option>
                                                        <option value="Normal">Normal</option>
                                                        <option value="Abnormal">Abnormal</option>
                                                    </select>
                                                </div>
                                                {form.xRayResult === "Abnormal" && (
                                                    <div className="sm:col-span-1 md:col-span-2">
                                                        <label className="block text-sm font-medium mb-1.5">Description</label>
                                                        <input type="text" placeholder="Description / Remarks..."
                                                            value={form.xRayResultDescription || ""}
                                                            onChange={e => set("xRayResultDescription", e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 animate-in fade-in zoom-in-95" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Laboratory Test Results */}
                                    {(isTestEnabled("cbc") || isTestEnabled("fbs") || isTestEnabled("cholesterol") || isTestEnabled("hbsag") || isTestEnabled("ua") || isTestEnabled("amphetamine")) && (
                                        <div>
                                            <h3 className="font-semibold text-primary mb-4 pb-2 border-b pt-4">Laboratory Test Results</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                {isTestEnabled("cbc") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">ความสมบูรณ์ของเม็ดเลือด (CBC)</label>
                                                        <input type="text" value={form.cbc} placeholder="Result..." onChange={e => set("cbc", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("fbs") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">ระดับน้ำตาลในเลือด (FBS)</label>
                                                        <input type="text" value={form.fbs} placeholder="Result..." onChange={e => set("fbs", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("cholesterol") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">ระดับไขมันในเลือด (Cholesterol)</label>
                                                        <input type="text" value={form.cholesterol} placeholder="Result..." onChange={e => set("cholesterol", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("hbsag") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">ตรวจหาเชื้อไวรัสตับอักเสบบี (HBSAG)</label>
                                                        <input type="text" value={form.hbsag} placeholder="Result..." onChange={e => set("hbsag", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("ua") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">ตรวจปัสสาวะทั่วไป (UA)</label>
                                                        <input type="text" value={form.ua} placeholder="Result..." onChange={e => set("ua", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                                {isTestEnabled("amphetamine") && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1.5">ตรวจหาสารเสพติดในปัสสาวะ (Amphetamine)</label>
                                                        <input type="text" value={form.amphetamine} placeholder="Result..." onChange={e => set("amphetamine", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {customFields.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold text-primary mb-4 border-b pb-2 pt-4">Custom Fields</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {customFields.map((field) => (
                                                <div key={field.id} className="flex flex-col gap-2">
                                                    <label className="block text-sm font-medium">{field.label}</label>
                                                    
                                                    {field.type === "text" && (
                                                        <input type="text" value={form.customData?.[field.id] || ""} onChange={e => setForm(prev => ({ ...prev, customData: { ...prev.customData, [field.id]: e.target.value } }))}
                                                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    )}
                                                    {field.type === "number" && (
                                                        <input type="number" step="any" value={form.customData?.[field.id] || ""} onChange={e => setForm(prev => ({ ...prev, customData: { ...prev.customData, [field.id]: e.target.value } }))}
                                                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                                    )}
                                                    {field.type === "select" && (
                                                        <select value={form.customData?.[field.id] || ""} onChange={e => setForm(prev => ({ ...prev, customData: { ...prev.customData, [field.id]: e.target.value } }))}
                                                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                            <option value="">- Select -</option>
                                                            {(field.options || "").split(",").map((opt: string) => opt.trim()).filter((o: string) => o).map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    {field.type === "radio" && (
                                                        <div className="flex flex-col gap-2">
                                                            {(field.options || "").split(",").map((opt: string) => opt.trim()).filter((o: string) => o).map((opt: string) => (
                                                                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                                                                    <input type="radio" name={`cf_${field.id}`} value={opt} checked={form.customData?.[field.id] === opt} onChange={e => setForm(prev => ({ ...prev, customData: { ...prev.customData, [field.id]: e.target.value } }))} className="text-primary" />
                                                                    {opt}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {field.allowExtraDescription && (
                                                        <input type="text" placeholder="Description / Remarks..." 
                                                            value={form.customData?.[`${field.id}_desc`] || ""}
                                                            onChange={e => setForm(prev => ({ ...prev, customData: { ...prev.customData, [`${field.id}_desc`]: e.target.value } }))}
                                                            className="w-full px-3 py-1.5 mt-1 rounded-md bg-secondary/50 border border-border/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/60" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                </div>
            )}

            {/* Custom Reset Password Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background max-w-md w-full rounded-2xl shadow-2xl border border-border/50 p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <span className="text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Reset Student Password?</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Are you sure you want to reset this student&apos;s password? They will need to create a new password next time they log in.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(false)}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary border border-border transition-colors flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeResetPassword}
                                disabled={resettingPassword}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex-1 flex items-center justify-center gap-1.5"
                            >
                                {resettingPassword ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Confirm Reset"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 shadow-2xl animate-in slide-in-from-bottom duration-300 backdrop-blur">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
