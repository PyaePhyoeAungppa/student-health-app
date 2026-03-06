"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function NewHealthRecordPage() {
    const router = useRouter();
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
        colorBlindness: "NORMAL",
        xRayResult: "",
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
        const payload = {
            ...form,
            weight: form.weight ? parseFloat(form.weight) : null,
            height: form.height ? parseFloat(form.height) : null,
        };
        const res = await fetch("/api/health-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setLoading(false);
        if (res.ok) {
            setSaved(true);
            setTimeout(() => router.push(preStudentId ? `/dashboard/students/${preStudentId}` : "/dashboard/health-records"), 1000);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="page-title">New Health Record</h1>
            </div>

            {saved && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    ✅ Health record saved successfully! Redirecting...
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Student</h2>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Select Student *</label>
                        <select required value={form.studentId} onChange={e => set("studentId", e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <option value="">— Choose a student —</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.firstName} {s.surName} ({s.studentId}) — {s.class}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Academic Year</label>
                        <input type="text" value={form.academicYear} onChange={e => set("academicYear", e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                </div>

                {/* Measurements */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Physical Measurements</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: "Weight (kg)", key: "weight", placeholder: "e.g. 45.5" },
                            { label: "Height (cm)", key: "height", placeholder: "e.g. 155" },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium mb-1.5">{label}</label>
                                <input type="number" step="0.1" value={(form as any)[key]} placeholder={placeholder}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Blood Type</label>
                            <select value={form.bloodType} onChange={e => set("bloodType", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                {["A", "B", "AB", "O", "UNKNOWN"].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Health Tests */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Health Tests</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: "Hearing Test", key: "hearingTest" },
                            { label: "Color Blindness", key: "colorBlindness" },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium mb-1.5">{label}</label>
                                <div className="flex gap-3">
                                    {["NORMAL", "ABNORMAL"].map(v => (
                                        <label key={v} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all text-sm ${(form as any)[key] === v ? v === "NORMAL" ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400" : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                                            <input type="radio" name={key} value={v} checked={(form as any)[key] === v} onChange={() => set(key, v)} className="sr-only" />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Vision Prescription</label>
                            <input type="text" value={form.visionPrescription} placeholder="e.g. 20/20 or -1.50"
                                onChange={e => set("visionPrescription", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">X-Ray Result</label>
                            <input type="text" value={form.xRayResult} placeholder="e.g. ปกติ"
                                onChange={e => set("xRayResult", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                </div>

                {/* Medical History */}
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Medical History</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: "Underlying Disease", key: "underlyingDisease", placeholder: "e.g. โรคหอบหืด, Asthma..." },
                            { label: "Drug Allergy", key: "drugAllergy", placeholder: "e.g. Penicillin" },
                            { label: "Body Examination Notes", key: "bodyExamination", placeholder: "e.g. ปกติ" },
                            { label: "Additional Notes", key: "additionalNotes", placeholder: "Any other notes..." },
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

                <button type="submit" disabled={loading || saved}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-70 hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Health Record</>}
                </button>
            </form>
        </div>
    );
}
