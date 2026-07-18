"use client";
import { useState } from "react";
import { HeartPulse, Search, Loader2, ShieldCheck, User, Eye, Ear, Globe } from "lucide-react";
import { formatDate, calculateAge, getBMICategory } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

const getWavyCirclePath = (cx: number, cy: number, radius: number, waves: number, amplitude: number) => {
    let path = "";
    const points = 120;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius + Math.sin(angle * waves) * amplitude;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        path += (i === 0 ? "M " : " L ") + `${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return path + " Z";
};

export default function StudentPortalPage() {
    const { t, language, setLanguage } = useLanguage();
    const [thaiId, setThaiId] = useState("");
    const [step, setStep] = useState<"id" | "register" | "login">("id");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCheckId = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/student-lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: thaiId, action: "check" }),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
                setError(t(data.error as any) || data.error || t("error"));
            } else {
                if (data.hasPassword) {
                    setStep("login");
                } else {
                    setStep("register");
                }
            }
        } catch (err) {
            setLoading(false);
            setError(t("error"));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/student-lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: thaiId, password, action: "login" }),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
                setError(t(data.error as any) || data.error || t("error"));
            } else {
                setResult(data);
            }
        } catch (err) {
            setLoading(false);
            setError(t("error"));
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t("passwordMismatch" as any));
            return;
        }
        if (password.length < 6) {
            setError(t("passwordLengthError" as any));
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/student-lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: thaiId, password, action: "register" }),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
                setError(t(data.error as any) || data.error || t("error"));
            } else {
                setResult(data);
            }
        } catch (err) {
            setLoading(false);
            setError(t("error"));
        }
    };

    const latestRecord = result?.healthRecords?.[0];
    const bmiInfo = latestRecord?.bmi ? getBMICategory(latestRecord.bmi) : null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-6 pt-16 relative overflow-hidden">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20 flex gap-2">
                <button onClick={() => setLanguage("th")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${language === "th" ? "bg-primary text-white" : "glass-card text-muted-foreground hover:text-foreground"}`}>TH</button>
                <button onClick={() => setLanguage("en")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${language === "en" ? "bg-primary text-white" : "glass-card text-muted-foreground hover:text-foreground"}`}>EN</button>
            </div>

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
                    style={{ background: "radial-gradient(circle, hsl(212, 100%, 52%) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
                    style={{ background: "radial-gradient(circle, hsl(199, 89%, 48%) 0%, transparent 70%)" }} />
            </div>

            <div className="w-full max-w-xl animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4 flex items-center justify-center group cursor-pointer">
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm transition-transform duration-700 ease-in-out group-hover:rotate-180">
                            <defs>
                                <linearGradient id="wavy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                                </linearGradient>
                            </defs>
                            <path
                                d={getWavyCirclePath(50, 50, 44, 14, 2.5)}
                                fill="url(#wavy-gradient)"
                            />
                            <circle cx="50" cy="50" r="37" fill="hsl(var(--card))" />
                            <circle cx="50" cy="50" r="34" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                        </svg>
                        <div className="relative z-10 w-[72px] h-[72px] rounded-full bg-primary/10 flex items-center justify-center">
                            <HeartPulse className="w-9 h-9 text-primary bouncy-avatar-icon" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">{t("studentHealthPortal")}</h1>
                    <p className="text-muted-foreground text-sm mt-2">{t("checkYourHealthData")}</p>
                </div>

                {/* Lookup Form */}
                {!result && (
                    <div className="glass-card p-8 shadow-2xl mb-6">
                        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                            <span>{t("privacyProtected")}</span>
                        </div>

                        {step === "id" && (
                            <form onSubmit={handleCheckId} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("studentIdOrThaiId" as any)}</label>
                                    <input type="text" value={thaiId} onChange={e => setThaiId(e.target.value)} required
                                        placeholder="e.g. STU001 or 1100100000001"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                                </div>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                                )}
                                <button type="submit" disabled={loading}
                                    className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-all"
                                    style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("loading")}</> : <>{t("continue" as any)} →</>}
                                </button>
                            </form>
                        )}

                        {step === "register" && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm mb-4">
                                    <p className="font-semibold text-primary">{t("firstTimeSetup" as any)}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{t("firstTimeMessage" as any)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">{t("studentIdOrThaiId" as any)}</label>
                                    <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border text-muted-foreground text-sm font-medium">{thaiId}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("createPassword" as any)}</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("confirmPassword" as any)}</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                                </div>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setStep("id"); setError(""); setPassword(""); setConfirmPassword(""); }}
                                        className="flex-1 py-3 rounded-lg font-semibold text-muted-foreground border border-border hover:bg-secondary/50 transition-all text-center text-sm">
                                        {t("back")}
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-[2] py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-all text-sm"
                                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("loading")}</> : t("createPassword" as any)}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === "login" && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">{t("studentIdOrThaiId" as any)}</label>
                                    <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border text-muted-foreground text-sm font-medium">{thaiId}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("enterPassword" as any)}</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                                </div>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setStep("id"); setError(""); setPassword(""); }}
                                        className="flex-1 py-3 rounded-lg font-semibold text-muted-foreground border border-border hover:bg-secondary/50 transition-all text-center text-sm">
                                        {t("back")}
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-[2] py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-all text-sm"
                                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("lookingUp")}</> : <><Search className="w-5 h-5" /> {t("viewMyHealthData")}</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Results */}
                {result && (
                    (() => {
                        const latestRecord = result.healthRecords?.[0];
                        const bmiInfo = latestRecord?.bmi ? getBMICategory(latestRecord.bmi) : null;
                        const isTestEnabled = (key: string) => result.school?.testsConfig ? result.school.testsConfig[key] !== false : true;
                        
                        return (
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
                                <div><span className="text-muted-foreground">{t("age")}: </span><span className="font-medium">{calculateAge(result.dob)} {t("years")}</span></div>
                                <div><span className="text-muted-foreground">{t("gender")}: </span><span className="font-medium">{t(result.gender.toLowerCase() as any) || result.gender}</span></div>
                            </div>
                        </div>

                        {/* Latest Health Record */}
                        {latestRecord && (
                            <div className="glass-card p-6">
                                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("latestMeasurements")}</h3>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {[
                                        { label: t("weight"), value: `${latestRecord.weight ?? "—"} kg` },
                                        { label: t("height"), value: `${latestRecord.height ?? "—"} cm` },
                                        { label: t("bmi"), value: latestRecord.bmi ?? "—" },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="text-center p-3 rounded-lg bg-secondary/50 border border-border">
                                            <p className="text-xl font-bold gradient-text">{value}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                {bmiInfo && (
                                    <div className={`p-3 rounded-lg text-sm text-center mb-4 ${bmiInfo.color.includes("green") ? "bg-green-500/10 text-green-400 border border-green-500/20" : bmiInfo.color.includes("blue") ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : bmiInfo.color.includes("yellow") ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                        {t("bmiCategory")}: <strong>{t(bmiInfo.key as any)}</strong>
                                    </div>
                                )}
                                <div className="space-y-6">
                                    {/* General Details */}
                                    <div>
                                        <h4 className="font-semibold text-primary mt-4 mb-2 border-b pb-1">General Details ข้อมูลทั่วไป</h4>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                { label: t("bloodType"), val: latestRecord.bloodType, enabled: isTestEnabled("bloodType") },
                                                { label: t("underlyingDisease"), val: latestRecord.underlyingDisease || t("none"), enabled: true },
                                                { label: t("drugAllergy"), val: latestRecord.drugAllergy || t("none"), enabled: true },
                                            ].filter(item => item.enabled).map(({ label, val }) => (
                                                <div key={label.toString()} className="flex justify-between">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <span className="font-medium text-right max-w-[60%]">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Examinations & Tests */}
                                    <div>
                                        <h4 className="font-semibold text-primary mt-6 mb-2 border-b pb-1">Examinations & Tests ผลตรวจ</h4>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                { label: "Symptoms เบื้องต้น", val: latestRecord.symptoms || "—", enabled: isTestEnabled("symptoms") },
                                                { label: "Hearing Test การได้ยิน", val: latestRecord.hearingTest || "—", enabled: isTestEnabled("hearingTest") },
                                                { label: "Color Blindness ตาบอดสี", val: latestRecord.colorBlindness || "—", enabled: isTestEnabled("colorBlindness") },
                                                { label: "Eye Test ทดสอบสายตา", val: latestRecord.eyeTest || "—", enabled: isTestEnabled("eyeTest") },
                                                { label: "Vision Left ตาซ้าย", val: latestRecord.visionBothEyesLeft || "—", enabled: isTestEnabled("visionBothEyes") },
                                                { label: "Vision Right ตาขวา", val: latestRecord.visionBothEyesRight || "—", enabled: isTestEnabled("visionBothEyes") },
                                                { label: "Flexibility ความอ่อนตัว (cm)", val: latestRecord.flexibility != null ? `${latestRecord.flexibility} cm` : "—", enabled: isTestEnabled("flexibility") },
                                                { label: "Handgrip Strength แรงบีบมือ", val: latestRecord.handgripStrength != null ? `${latestRecord.handgripStrength}` : "—", enabled: isTestEnabled("handgripStrength") },
                                                { label: "Standing Knee Raises ยืนยกเข่า", val: latestRecord.standingKneeRaises != null ? `${latestRecord.standingKneeRaises}` : "—", enabled: isTestEnabled("standingKneeRaises") },
                                                { label: "Sit-ups ลุกนั่ง", val: latestRecord.situps != null ? `${latestRecord.situps}` : "—", enabled: isTestEnabled("situps") },
                                                { label: "Push-ups ดันพื้น", val: latestRecord.pushups != null ? `${latestRecord.pushups}` : "—", enabled: isTestEnabled("pushups") },
                                                { label: "X-Ray Result", val: latestRecord.xRayResult || "—", enabled: isTestEnabled("xRayResult") },
                                            ].filter(item => item.enabled).map(({ label, val }) => (
                                                <div key={label} className="flex justify-between">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <span className="font-medium text-right max-w-[60%]">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 10 Steps Physical Examination */}
                                    {isTestEnabled("tenSteps") && (
                                        <div>
                                            <h4 className="font-semibold text-primary mt-6 mb-2 border-b pb-1">10 Steps Physical Examination</h4>
                                            <div className="grid grid-cols-1 gap-y-3 text-sm">
                                                {[
                                                    ["Ear Eye Throat Nose", latestRecord.earEyeThroatNose?.join(", ")],
                                                    ["Auscultation (Heart/Lungs)", latestRecord.auscultation?.join(", ")],
                                                    ["Cleanliness", latestRecord.cleanliness?.join(", ")],
                                                    ["Mouth", latestRecord.mouth?.join(", ")],
                                                    ["Kidney", latestRecord.kidney ? "Yes/พบ" : "Normal/ปกติ"],
                                                    ["Thyroid", latestRecord.thyroid ? "Yes/พบ" : "Normal/ปกติ"],
                                                    ["Lymphnode", latestRecord.lymphnode ? "Yes/พบ" : "Normal/ปกติ"],
                                                    ["Skin", latestRecord.skin?.join(", ")],
                                                    ["Bone", latestRecord.bone?.join(", ")],
                                                ].map(([label, val]) => (
                                                    <div key={label.toString()} className="flex justify-between border-b border-border/50 pb-1">
                                                        <span className="text-muted-foreground w-1/3">{label}</span>
                                                        <span className="font-medium text-right text-xs max-w-[60%]">{val || "Normal / ปกติ"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Health Info */}
                                    <div>
                                        <h4 className="font-semibold text-primary mt-6 mb-2 border-b pb-1">Additional Health Info</h4>
                                        <div className="grid grid-cols-1 gap-y-3 text-sm">
                                            {[
                                                ["Body Examination", latestRecord.bodyExamination || "—"],
                                                ["Doctor Note", latestRecord.doctorNote || "—"],
                                                [t("additionalNotes"), latestRecord.additionalNotes || "—"],
                                            ].map(([label, val]) => (
                                                <div key={label.toString()} className="flex justify-between border-b border-border/50 pb-1">
                                                    <span className="text-muted-foreground w-1/3">{label}</span>
                                                    <span className="font-medium text-right text-xs max-w-[60%]">{val || "—"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={() => { setResult(null); setThaiId(""); setPassword(""); setConfirmPassword(""); setStep("id"); }}
                            className="w-full py-2.5 rounded-lg text-sm text-muted-foreground border border-border hover:bg-secondary/50 transition-colors">
                            ← {t("backToLookup")}
                        </button>
                            </div>
                        );
                    })()
                )}

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Staff?{" "}
                    <a href="/login" className="text-primary hover:underline">{t("staffSignIn")} →</a>
                </p>
            </div>
        </div>
    );
}
