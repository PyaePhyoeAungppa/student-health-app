"use client";
import { useState } from "react";
import { HeartPulse, Search, Loader2, ShieldCheck, User, Eye, Ear } from "lucide-react";
import { formatDateEn, calculateAge, getBMICategory } from "@/lib/utils";

export default function StudentPortalPage() {
    const [studentId, setStudentId] = useState("");
    const [dob, setDob] = useState("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);
        const res = await fetch("/api/student-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, dob }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) {
            setError(data.error || "An error occurred.");
        } else {
            setResult(data);
        }
    };

    const latestRecord = result?.healthRecords?.[0];
    const bmiInfo = latestRecord?.bmi ? getBMICategory(latestRecord.bmi) : null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-6 pt-16 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
                    style={{ background: "radial-gradient(circle, hsl(199,89%,48%) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
                    style={{ background: "radial-gradient(circle, hsl(262,83%,58%) 0%, transparent 70%)" }} />
            </div>

            <div className="w-full max-w-xl animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 ring-2 ring-primary/30"
                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                        <HeartPulse className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Student Health Portal</h1>
                    <p className="text-muted-foreground text-sm mt-2">ตรวจสอบข้อมูลสุขภาพของคุณ | Check Your Health Data</p>
                </div>

                {/* Lookup Form */}
                <div className="glass-card p-8 shadow-2xl mb-6">
                    <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <span>Your privacy is protected — only you can access your data.</span>
                    </div>

                    <form onSubmit={handleLookup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Student ID (รหัสนักเรียน)</label>
                            <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} required
                                placeholder="e.g. STU001"
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Date of Birth (วันเกิด)</label>
                            <input type="date" value={dob} onChange={e => setDob(e.target.value)} required
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                        </div>
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                        )}
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-all"
                            style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Looking up...</> : <><Search className="w-5 h-5" /> View My Health Data</>}
                        </button>
                    </form>
                </div>

                {/* Results */}
                {result && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Student Info */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{result.firstName} {result.surName}</h2>
                                    <p className="text-muted-foreground text-sm">{result.studentId} · {result.class} · {result.school?.name}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Age: </span><span className="font-medium">{calculateAge(result.dob)} years</span></div>
                                <div><span className="text-muted-foreground">Gender: </span><span className="font-medium">{result.gender}</span></div>
                            </div>
                        </div>

                        {/* Latest Health Record */}
                        {latestRecord && (
                            <div className="glass-card p-6">
                                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Latest Health Measurements</h3>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {[
                                        { label: "Weight", value: `${latestRecord.weight ?? "—"} kg` },
                                        { label: "Height", value: `${latestRecord.height ?? "—"} cm` },
                                        { label: "BMI", value: latestRecord.bmi ?? "—" },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="text-center p-3 rounded-lg bg-secondary/50 border border-border">
                                            <p className="text-xl font-bold gradient-text">{value}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                {bmiInfo && (
                                    <div className={`p-3 rounded-lg text-sm text-center mb-4 ${bmiInfo.color.includes("green") ? "bg-green-500/10 text-green-400 border border-green-500/20" : bmiInfo.color.includes("blue") ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : bmiInfo.color.includes("yellow") ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                        BMI Category: <strong>{bmiInfo.label}</strong>
                                    </div>
                                )}
                                <div className="space-y-2 text-sm">
                                    {[
                                        ["Blood Type", latestRecord.bloodType],
                                        ["Vision", latestRecord.visionPrescription || "20/20"],
                                        ["Underlying Disease", latestRecord.underlyingDisease || "None"],
                                        ["Drug Allergy", latestRecord.drugAllergy || "None"],
                                        ["Hearing Test", latestRecord.hearingTest],
                                        ["Color Blindness", latestRecord.colorBlindness],
                                        ["X-Ray Result", latestRecord.xRayResult || "—"],
                                    ].map(([label, val]) => (
                                        <div key={label} className="flex justify-between">
                                            <span className="text-muted-foreground">{label}</span>
                                            {label === "Hearing Test" || label === "Color Blindness" ? (
                                                <span className={val === "NORMAL" ? "badge-normal" : "badge-abnormal"}>{val}</span>
                                            ) : (
                                                <span className="font-medium">{val}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={() => { setResult(null); setStudentId(""); setDob(""); }}
                            className="w-full py-2.5 rounded-lg text-sm text-muted-foreground border border-border hover:bg-secondary/50 transition-colors">
                            ← Back to Lookup
                        </button>
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Staff?{" "}
                    <a href="/login" className="text-primary hover:underline">Sign in to the admin portal →</a>
                </p>
            </div>
        </div>
    );
}
