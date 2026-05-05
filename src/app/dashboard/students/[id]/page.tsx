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
        weight: "", height: "", hearingTest: "", bodyExamination: "",
        visionPrescription: "", visionDistance: "", visionResult: "",
        colorBlindness: "", xRayResult: "", doctorNote: "", additionalNotes: "",
        earEyeThroatNose: [] as string[],
        auscultation: [] as string[],
        cleanliness: [] as string[],
        mouth: [] as string[],
        kidney: false,
        thyroid: false,
        lymphnode: false,
        skin: [] as string[],
        bone: [] as string[],
        eyeTest: "",
        visionBothEyesLeft: "",
        visionBothEyesRight: "",
        symptoms: "",
        flexibility: "",
        handgripStrength: "",
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
                        bloodType: latest.bloodType || "UNKNOWN",
                        weight: latest.weight != null ? String(latest.weight) : "",
                        height: latest.height != null ? String(latest.height) : "",
                        hearingTest: latest.hearingTest || "",
                        bodyExamination: latest.bodyExamination || "",
                        visionPrescription: latest.visionPrescription || "",
                        visionDistance: latest.visionDistance || "",
                        visionResult: latest.visionResult || "",
                        colorBlindness: latest.colorBlindness || "",
                        xRayResult: latest.xRayResult || "",
                        doctorNote: latest.doctorNote || "",
                        additionalNotes: latest.additionalNotes || "",
                        earEyeThroatNose: latest.earEyeThroatNose || [],
                        auscultation: latest.auscultation || [],
                        cleanliness: latest.cleanliness || [],
                        mouth: latest.mouth || [],
                        kidney: latest.kidney || false,
                        thyroid: latest.thyroid || false,
                        lymphnode: latest.lymphnode || false,
                        skin: latest.skin || [],
                        bone: latest.bone || [],
                        eyeTest: latest.eyeTest || "",
                        visionBothEyesLeft: latest.visionBothEyesLeft || "",
                        visionBothEyesRight: latest.visionBothEyesRight || "",
                        symptoms: latest.symptoms || "",
                        flexibility: latest.flexibility != null ? String(latest.flexibility) : "",
                        handgripStrength: latest.handgripStrength != null ? String(latest.handgripStrength) : "",
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

        const flex = form.flexibility ? parseFloat(form.flexibility) : null;
        const grip = form.handgripStrength ? parseFloat(form.handgripStrength) : null;
        const payload = { ...form, studentId: student.id, weight: w, height: h, bmi, flexibility: flex, handgripStrength: grip };
        
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
                weight: "", height: "", hearingTest: "", bodyExamination: "",
                visionPrescription: "", visionDistance: "", visionResult: "",
                colorBlindness: "", xRayResult: "", doctorNote: "", additionalNotes: "",
                earEyeThroatNose: [], auscultation: [], cleanliness: [], mouth: [], kidney: false, thyroid: false, lymphnode: false, skin: [], bone: [], eyeTest: "", visionBothEyesLeft: "", visionBothEyesRight: "", symptoms: "", flexibility: "", handgripStrength: "",
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
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">{t("latestHealthRecord")}</h2>
                                
                                <div className="space-y-6">
                                    {/* General Details */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">General Details</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {[
                                                [t("bloodType"), latestRecord.bloodType],
                                                [t("underlyingDisease"), latestRecord.underlyingDisease || t("none")],
                                                [t("drugAllergy"), latestRecord.drugAllergy || t("none")],
                                                [t("year"), latestRecord.academicYear || "—"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <span className="font-medium text-right">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tests & Examinations */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">Tests & Examinations</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {[
                                                ["Symptoms", latestRecord.symptoms || "N/A"],
                                                ["Hearing Test", latestRecord.hearingTest || "N/A"],
                                                ["Color Blindness", latestRecord.colorBlindness || "N/A"],
                                                ["Eye Test", latestRecord.eyeTest || "N/A"],
                                                ["Vision (Left)", latestRecord.visionBothEyesLeft || "N/A"],
                                                ["Vision (Right)", latestRecord.visionBothEyesRight || "N/A"],
                                                ["Flexibility (cm)", latestRecord.flexibility ? `${latestRecord.flexibility} cm` : "N/A"],
                                                ["Handgrip", latestRecord.handgripStrength ? `${latestRecord.handgripStrength}` : "N/A"],
                                                ["X-Ray Result", latestRecord.xRayResult || "N/A"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <span className="font-medium text-right">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 10 Steps Physical Examination */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">10 Steps Physical Examination</h3>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                ["Ear Eye Throat Nose", latestRecord.earEyeThroatNose?.length ? latestRecord.earEyeThroatNose.join(", ") : "N/A"],
                                                ["Auscultation", latestRecord.auscultation?.length ? latestRecord.auscultation.join(", ") : "N/A"],
                                                ["Cleanliness", latestRecord.cleanliness?.length ? latestRecord.cleanliness.join(", ") : "N/A"],
                                                ["Mouth", latestRecord.mouth?.length ? latestRecord.mouth.join(", ") : "N/A"],
                                                ["Kidney", latestRecord.kidney ? "Yes / พบ" : "N/A"],
                                                ["Thyroid", latestRecord.thyroid ? "Yes / พบ" : "N/A"],
                                                ["Lymphnode", latestRecord.lymphnode ? "Yes / พบ" : "N/A"],
                                                ["Skin", latestRecord.skin?.length ? latestRecord.skin.join(", ") : "N/A"],
                                                ["Bone", latestRecord.bone?.length ? latestRecord.bone.join(", ") : "N/A"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                    <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                                                    <span className="font-medium text-right">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Health Info */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">Additional Health Info</h3>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                ["Body Examination", latestRecord.bodyExamination || "N/A"],
                                                ["Doctor Note", latestRecord.doctorNote || "N/A"],
                                                [t("additionalNotes"), latestRecord.additionalNotes || "N/A"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                                                    <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                                                    <span className="font-medium text-right">{val}</span>
                                                </div>
                                            ))}
                                        </div>
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
                                {/* Year is hidden and managed automatically */}
                                <input type="hidden" value={form.academicYear} name="academicYear" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 font-bold text-primary">Blood Group / กรุ๊ปเลือด</label>
                                        <select value={form.bloodType || "UNKNOWN"} onChange={e => set("bloodType", e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="AB">AB</option>
                                            <option value="O">O</option>
                                            <option value="UNKNOWN">Unknown / ไม่ทราบ</option>
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
                                                                {/* 10 Steps of a General Physical Examination */}
                                <div>
                                    <h3 className="font-semibold text-primary mb-4 border-b pb-2">10 Steps of a General Physical Examination ตรวจร่างกายทั่วไป 10 ขั้นตอน</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Ear Eye Throat Nose */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Ear Eye Throat Nose หู ตา คอ จมูก</label>
                                            <div className="space-y-1 mt-2">
                                                {["Eye Eyelid ตา เปลือกตา", "Ear Earwaxใบหู ขี้หู", "Nose Nasal Cavity จมูก โพรงจมูก", "Throat / Tonsil gland คอ ต่อมทอนซิล"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={form.earEyeThroatNose.includes(opt)} onChange={() => toggleArrayItem('earEyeThroatNose', opt)} className="rounded" /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Auscultation */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Auscultation of the heart and lungs ฟังเสียงการเต้นของหัวใจ ปอด</label>
                                            <div className="space-y-1 mt-2">
                                                {["Heart หัวใจ", "Lung ปอด"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={form.auscultation.includes(opt)} onChange={() => toggleArrayItem('auscultation', opt)} className="rounded" /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cleanliness */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Cleanliness ความสะอาด</label>
                                            <div className="space-y-1 mt-2">
                                                {["hair ผม", "scalp หนังศีรษะ", "presence of lice or nits เหา ไข่เหา", "long nails เล็บยาว"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={form.cleanliness.includes(opt)} onChange={() => toggleArrayItem('cleanliness', opt)} className="rounded" /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mouth */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Mouth ช่องปาก</label>
                                            <div className="space-y-1 mt-2">
                                                {["Decay teeth ฟันผุ", "Tar tar คราบหินปูน"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={form.mouth.includes(opt)} onChange={() => toggleArrayItem('mouth', opt)} className="rounded" /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Glands & Nodes */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Glands & Nodes ไต ไทรอยด์ ต่อมน้ำเหลือง</label>
                                            <div className="space-y-2 mt-2">
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.kidney} onChange={e => set('kidney', e.target.checked)} className="rounded" /> Kidney ไต</label>
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.thyroid} onChange={e => set('thyroid', e.target.checked)} className="rounded" /> Thyroid gland ไทรอยด์</label>
                                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lymphnode} onChange={e => set('lymphnode', e.target.checked)} className="rounded" /> lympnode ต่อมน้ำเหลือง</label>
                                            </div>
                                        </div>

                                        {/* Skin */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Skin ผิวหนัง</label>
                                            <div className="space-y-1 mt-2">
                                                {["Rash ผื่นคัน", "Dry skin แห้งลอก", "Wound แผลสด"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={form.skin.includes(opt)} onChange={() => toggleArrayItem('skin', opt)} className="rounded" /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Bone */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 border-b pb-1">Bone กระดูก</label>
                                            <div className="space-y-1 mt-2">
                                                {["Bow leg ขาโก่ง", "Crooked arms แขนคดงอ"].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={form.bone.includes(opt)} onChange={() => toggleArrayItem('bone', opt)} className="rounded" /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Examinations & Tests */}
                                <div>
                                    <h3 className="font-semibold text-primary mb-4 border-b pb-2 pt-4">Symptoms and Tests</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Symptoms / Health อาการเจ็บป่วยเบื้องต้น</label>
                                            <select value={form.symptoms} onChange={e => set("symptoms", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="">- Select -</option>
                                                <option value="Normal ปกติ">Normal ปกติ</option>
                                                <option value="Abnormal ไม่ปกติ">Abnormal ไม่ปกติ</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Hearing Test การได้ยิน</label>
                                            <select value={form.hearingTest} onChange={e => set("hearingTest", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="">N/A — Not Examined</option>
                                                <option value="Normal ปกติ">Normal ปกติ</option>
                                                <option value="Abnormal ผิดปกติ (Right ear หูขวา)">Abnormal ผิดปกติ (Right หูขวา)</option>
                                                <option value="Abnormal ผิดปกติ (Left ear หูซ้าย)">Abnormal ผิดปกติ (Left หูซ้าย)</option>
                                                <option value="Abnormal ผิดปกติ (Both side ทั้งสองข้าง)">Abnormal ผิดปกติ (Both ทั้งสองข้าง)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Color Blindness ตาบอดสี</label>
                                            <select value={form.colorBlindness} onChange={e => set("colorBlindness", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="">N/A — Not Examined</option>
                                                <option value="Pass ผ่าน">Pass ผ่าน</option>
                                                <option value="Not pass ไม่ผ่าน">Not pass ไม่ผ่าน</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Eye Test การทดสอบสายตา</label>
                                            <select value={form.eyeTest} onChange={e => set("eyeTest", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="">- Select -</option>
                                                <option value="Have glasses มีแว่นตา">Have glasses มีแว่นตา</option>
                                                <option value="No Glasses ตาเปล่า">No Glasses ตาเปล่า</option>
                                                <option value="Didn't bring the glasssไม่ นำแว่นมา">Didn&apos;t bring the glasssไม่ นำแว่นมา</option>
                                                <option value="Blindness เสียการมองเห็น (ตาบอด)">Blindness เสียการมองเห็น (ตาบอด)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {form.eyeTest !== "Blindness เสียการมองเห็น (ตาบอด)" && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">Vision Left Eye ตาซ้าย</label>
                                                <select value={form.visionBothEyesLeft} onChange={e => set("visionBothEyesLeft", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                    <option value="">- Select -</option>
                                                    <option value="20/20 ปกติ">20/20 ปกติ</option>
                                                    <option value="20/30 ผิดปกติ">20/30 ผิดปกติ</option>
                                                    <option value="20/50 ผิดปกติ">20/50 ผิดปกติ</option>
                                                    <option value="20/100 ผิดปกติ">20/100 ผิดปกติ</option>
                                                    <option value="20/200 ผิดปกติ">20/200 ผิดปกติ</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5">Vision Right Eye ตาขวา</label>
                                                <select value={form.visionBothEyesRight} onChange={e => set("visionBothEyesRight", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                    <option value="">- Select -</option>
                                                    <option value="20/20 ปกติ">20/20 ปกติ</option>
                                                    <option value="20/30 ผิดปกติ">20/30 ผิดปกติ</option>
                                                    <option value="20/50 ผิดปกติ">20/50 ผิดปกติ</option>
                                                    <option value="20/100 ผิดปกติ">20/100 ผิดปกติ</option>
                                                    <option value="20/200 ผิดปกติ">20/200 ผิดปกติ</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Flexibility วัดความอ่อนตัว (cm)</label>
                                            <input type="number" step="0.1" min="-30" max="30" value={form.flexibility} placeholder="-30 to 30 cm" onChange={e => set("flexibility", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Handgrip Strength แรงบีบมือ</label>
                                            <input type="number" step="0.1" min="0" max="50" value={form.handgripStrength} placeholder="0-50" onChange={e => set("handgripStrength", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">X-Ray Result</label>
                                            <select value={form.xRayResult} onChange={e => set("xRayResult", e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="">N/A — Not Examined</option>
                                                <option value="Normal ปกติ">Normal ปกติ</option>
                                                <option value="Abnormal ไม่ปกติ">Abnormal ไม่ปกติ</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-primary mb-4 border-b pb-2 pt-4">Additional Health Info</h3>
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
