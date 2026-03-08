"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export default function SchoolsPage() {
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const role = (session?.user as any)?.role;
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: "", province: "", address: "" });

    const fetchSchools = () => {
        setLoading(true);
        fetch("/api/schools")
            .then(r => r.json())
            .then(d => { setSchools(Array.isArray(d) ? d : []); setLoading(false); });
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        const res = await fetch("/api/schools", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setAdding(false);
        if (res.ok) {
            setForm({ name: "", province: "", address: "" });
            setShowAddForm(false);
            fetchSchools();
        } else {
            alert(t("error") || "Failed to create school.");
        }
    };

    return (
        <div>
            <div className="page-header flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-auto">
                    <h1 className="page-title">{t("schoolManagement")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{schools.length} {t("allSchoolsRegistered")}</p>
                </div>
                {role === "SYSTEM_ADMIN" && (
                    <button onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all w-full sm:w-auto"
                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                        <Plus className="w-4 h-4" /> {t("addSchool")}
                    </button>
                )}
            </div>

            {showAddForm && role === "SYSTEM_ADMIN" && (
                <div className="glass-card mb-6 animate-fade-in p-6">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">{t("addSchool")}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("schoolName")} *</label>
                            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t("province")}</label>
                            <input type="text" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5">{t("address")}</label>
                            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors">{t("cancel")}</button>
                            <button type="submit" disabled={adding} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
                                {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}</> : t("save")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : schools.length === 0 ? (
                    <div className="col-span-full text-center p-12 text-muted-foreground bg-secondary/30 rounded-2xl border border-border border-dashed">
                        {t("noData")}
                    </div>
                ) : schools.map(school => (
                    <div key={school.id} className="glass-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-all">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">{school.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{school.province || t("noData")}</p>
                            {school.address && (
                                <div className="p-3 bg-secondary/50 rounded-lg text-sm mb-4 border border-border/50">
                                    <span className="text-muted-foreground text-xs block mb-1">{t("address")}</span>
                                    {school.address}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground border-t border-border/50 pt-3 mt-2">
                            {t("generated")} {formatDate(school.createdAt, language)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
