"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";

export default function NewStudentPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const userSchoolId = (session?.user as any)?.schoolId;

    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        studentId: "",
        firstName: "",
        surName: "",
        gender: "Male",
        class: "",
        orderNumber: "1",
        dob: "",
        schoolId: userSchoolId || "",
    });

    useEffect(() => {
        if (role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") {
            fetch("/api/schools")
                .then(r => r.json())
                .then(d => setSchools(Array.isArray(d) ? d : []));
        }
    }, [role]);

    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = {
            ...form,
            orderNumber: parseInt(form.orderNumber),
            dob: new Date(form.dob).toISOString(),
        };

        const res = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setLoading(false);
        if (res.ok) {
            setSaved(true);
            setTimeout(() => router.push("/dashboard/students"), 1500);
        } else {
            const data = await res.json();
            setError(data.error || t("error"));
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="page-title">{t("registerNewStudent")}</h1>
            </div>

            {saved && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    ✅ {t("studentRegisteredSuccess")}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("personalInfo")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("studentId")} *</label>
                            <input type="text" required value={form.studentId} onChange={e => set("studentId", e.target.value)}
                                placeholder="STU12345"
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("dob")} *</label>
                            <input type="date" required value={form.dob} onChange={e => set("dob", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("firstName")} *</label>
                            <input type="text" required value={form.firstName} onChange={e => set("firstName", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("lastName")} *</label>
                            <input type="text" required value={form.surName} onChange={e => set("surName", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("gender")} *</label>
                            <select required value={form.gender} onChange={e => set("gender", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                <option value="Male">{t("male")}</option>
                                <option value="Female">{t("female")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("academicDetails")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1.5">{t("assignToSchool")} *</label>
                                <select required value={form.schoolId} onChange={e => set("schoolId", e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="">— {t("filter").replace(":", "")} —</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.province})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("classRoom")} *</label>
                            <input type="text" required value={form.class} onChange={e => set("class", e.target.value)}
                                placeholder="e.g. 1/1, 2A"
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("rosterNumber")} *</label>
                            <input type="number" required min="1" value={form.orderNumber} onChange={e => set("orderNumber", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading || saved}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-70 hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("loading")}</> : <><Save className="w-5 h-5" /> {t("saveStudent")}</>}
                </button>
            </form>
        </div>
    );
}
