"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function NewStudentPage() {
    const router = useRouter();
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
            setTimeout(() => router.push("/dashboard/students"), 1000);
        } else {
            const data = await res.json();
            setError(data.error || "Failed to add student.");
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="page-title">Register New Student</h1>
            </div>

            {saved && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    ✅ Student registered successfully! Redirecting...
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Personal Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Student ID *</label>
                            <input type="text" required value={form.studentId} onChange={e => set("studentId", e.target.value)}
                                placeholder="e.g. STU12345"
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Date of Birth *</label>
                            <input type="date" required value={form.dob} onChange={e => set("dob", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">First Name *</label>
                            <input type="text" required value={form.firstName} onChange={e => set("firstName", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Last Name (Surname) *</label>
                            <input type="text" required value={form.surName} onChange={e => set("surName", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Gender *</label>
                            <select required value={form.gender} onChange={e => set("gender", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Academic Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1.5">Assign to School *</label>
                                <select required value={form.schoolId} onChange={e => set("schoolId", e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="">— Choose a school —</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.province})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Class / Room *</label>
                            <input type="text" required value={form.class} onChange={e => set("class", e.target.value)}
                                placeholder="e.g. 1/1, 2A"
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Order / Roster Number *</label>
                            <input type="number" required min="1" value={form.orderNumber} onChange={e => set("orderNumber", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading || saved}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-70 hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</> : <><Save className="w-5 h-5" /> Save Student</>}
                </button>
            </form>
        </div>
    );
}
