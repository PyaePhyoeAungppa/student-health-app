"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Building2, Edit, Trash2, X, AlertOctagon } from "lucide-react";
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [schoolToDelete, setSchoolToDelete] = useState<{ id: string, name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const defaultTestsConfig = {
        flexibility: true,
        handgripStrength: true,
        standingKneeRaises: true,
        situps: true,
        pushups: true,
        xRayResult: true,
        cbc: true,
        fbs: true,
        cholesterol: true,
        hbsag: true,
        ua: true,
        amphetamine: true,
    };

    const [form, setForm] = useState({ name: "", governmentId: "", systemId: "", testsConfig: defaultTestsConfig, customFields: [] as any[] });

    const [showFieldForm, setShowFieldForm] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [fieldForm, setFieldForm] = useState({
        label: "",
        type: "text", // text, number, select, radio
        options: "", // comma separated
        allowExtraDescription: false
    });

    const openAddForm = () => {
        setForm({ name: "", governmentId: "", systemId: "", testsConfig: defaultTestsConfig, customFields: [] });
        setEditingId(null);
        setShowAddForm(true);
    };

    const handleEdit = (school: any) => {
        setForm({ 
            name: school.name, 
            governmentId: school.governmentId || "",
            systemId: school.systemId || "",
            testsConfig: school.testsConfig || defaultTestsConfig,
            customFields: school.customFields || []
        });
        setEditingId(school.id);
        setShowAddForm(true);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setSchoolToDelete({ id, name });
    };

    const confirmDelete = async () => {
        if (!schoolToDelete) return;
        setDeleting(true);
        const res = await fetch(`/api/schools/${schoolToDelete.id}`, { method: "DELETE" });
        setDeleting(false);
        if (res.ok) {
            setSchoolToDelete(null);
            fetchSchools();
        } else {
            alert(t("error") || "Failed to delete school.");
        }
    };

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
        
        const url = editingId ? `/api/schools/${editingId}` : "/api/schools";
        const method = editingId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setAdding(false);
        if (res.ok) {
            setForm({ name: "", governmentId: "", systemId: "", testsConfig: defaultTestsConfig, customFields: [] });
            setShowAddForm(false);
            setEditingId(null);
            fetchSchools();
        } else {
            alert(t("error") || "Failed to save school.");
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
                    <button onClick={showAddForm && !editingId ? () => setShowAddForm(false) : openAddForm}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all w-full sm:w-auto"
                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}>
                        <Plus className="w-4 h-4" /> {t("addSchool")}
                    </button>
                )}
            </div>

            {showAddForm && role === "SYSTEM_ADMIN" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden relative">
                        <div className="p-6 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-semibold text-lg">
                                    {editingId ? t("edit") || "Edit School" : t("addSchool")}
                                </h2>
                                <button onClick={() => setShowAddForm(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("schoolName")} *</label>
                                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("governmentId") || "Government ID"}</label>
                                    <input type="text" value={form.governmentId} onChange={e => setForm({ ...form, governmentId: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                {editingId && form.systemId && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1.5">{t("systemId") || "System ID"}</label>
                                        <input type="text" readOnly value={form.systemId}
                                            className="w-full px-4 py-2.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground font-mono focus:outline-none cursor-not-allowed" />
                                    </div>
                                )}
                                <div className="md:col-span-2 mt-2 pt-4 border-t border-border/30">
                                    <label className="block text-sm font-medium mb-3">{t("configuredHealthAssessments") || "การทดสอบสมรรถภาพทางกาย"}</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-secondary/30 p-4 rounded-xl border border-border/50">
                                        {[
                                            { key: "flexibility", label: t("flexibility") || "ความอ่อนตัว (Flexibility)" },
                                            { key: "handgripStrength", label: "แรงบีบมือ : Hand Grip Strength" },
                                            { key: "standingKneeRaises", label: "ยืนยกเข่า 3 นาที : 3 Minutes Step Up and Down" },
                                            { key: "situps", label: "ลุก-นั่ง 60 วินาที : 60 Seconds Sit-ups" },
                                            { key: "pushups", label: "ดันพื้นประยุกต์ 30 วินาที : 30 Seconds Modified Push-ups" },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors">
                                                <input type="checkbox" 
                                                    checked={form.testsConfig[item.key as keyof typeof defaultTestsConfig]} 
                                                    onChange={e => setForm({
                                                        ...form, 
                                                        testsConfig: { ...form.testsConfig, [item.key]: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                                                <span>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2 mt-2 pt-4 border-t border-border/30">
                                    <label className="block text-sm font-medium mb-3">X-Ray</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-secondary/30 p-4 rounded-xl border border-border/50">
                                        {[
                                            { key: "xRayResult", label: "X-Ray" },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors">
                                                <input type="checkbox" 
                                                    checked={form.testsConfig[item.key as keyof typeof defaultTestsConfig]} 
                                                    onChange={e => setForm({
                                                        ...form, 
                                                        testsConfig: { ...form.testsConfig, [item.key]: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                                                <span>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2 mt-2 pt-4 border-t border-border/30">
                                    <label className="block text-sm font-medium mb-3">ผลตรวจห้องปฏิบัติการ (Laboratory Test Results)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-secondary/30 p-4 rounded-xl border border-border/50">
                                        {[
                                            { key: "cbc", label: "ความสมบูรณ์ของเม็ดเลือด (CBC)" },
                                            { key: "fbs", label: "ระดับน้ำตาลในเลือด (FBS)" },
                                            { key: "cholesterol", label: "ระดับไขมันในเลือด (Cholesterol)" },
                                            { key: "hbsag", label: "ตรวจหาเชื้อไวรัสตับอักเสบบี (HBSAG)" },
                                            { key: "ua", label: "ตรวจปัสสาวะทั่วไป (UA)" },
                                            { key: "amphetamine", label: "ตรวจหาสารเสพติดในปัสสาวะ (Amphetamine)" },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-secondary/50 p-2 rounded-lg transition-colors">
                                                <input type="checkbox" 
                                                    checked={form.testsConfig[item.key as keyof typeof defaultTestsConfig]} 
                                                    onChange={e => setForm({
                                                        ...form, 
                                                        testsConfig: { ...form.testsConfig, [item.key]: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                                                <span>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Custom Fields Section */}
                                <div className="md:col-span-2 mt-2 pt-4 border-t border-border/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("customHealthFields" as any) || "Custom Health Fields"}</h3>
                                        <button type="button" onClick={() => { setFieldForm({ label: "", type: "text", options: "", allowExtraDescription: false }); setEditingFieldId(null); setShowFieldForm(true); }} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg flex items-center gap-1 hover:bg-primary/90 transition-colors shrink-0">
                                            <Plus className="w-3 h-3" /> {t("add") || "Add"}
                                        </button>
                                    </div>
                                    <div className="rounded-xl border border-border overflow-hidden bg-secondary/10">
                                        {form.customFields.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-muted-foreground bg-secondary/20">
                                                {t("noData") || "No custom fields added"}
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="bg-secondary/50 border-b border-border">
                                                            <th className="px-4 py-2 font-semibold">Label</th>
                                                            <th className="px-4 py-2 font-semibold">Type</th>
                                                            <th className="px-4 py-2 font-semibold">Options</th>
                                                            <th className="px-4 py-2 font-semibold text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {form.customFields.map((f: any) => (
                                                            <tr key={f.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                                                                <td className="px-4 py-2">{f.label}</td>
                                                                <td className="px-4 py-2 capitalize">{f.type}</td>
                                                                <td className="px-4 py-2">{f.options || "—"}</td>
                                                                <td className="px-4 py-2 text-right">
                                                                    <button type="button" onClick={() => { setFieldForm({ label: f.label, type: f.type, options: f.options || "", allowExtraDescription: !!f.allowExtraDescription }); setEditingFieldId(f.id); setShowFieldForm(true); }} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button type="button" onClick={() => { if(confirm("Are you sure?")) setForm({...form, customFields: form.customFields.filter(x => x.id !== f.id)}) }} className="p-1 text-muted-foreground hover:text-red-500 transition-colors ml-1">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-border/30">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">{t("cancel")}</button>
                                    <button type="submit" disabled={adding} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
                                        {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}</> : t("save")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
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
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                {role === "SYSTEM_ADMIN" && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(school)} type="button" className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(school.id, school.name)} type="button" className="p-2 bg-secondary text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-1">{school.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("systemId") || "System ID"}: <span className="font-mono text-foreground font-medium">{school.systemId || t("noData")}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("governmentId") || "Government ID"}: <span className="font-mono text-foreground font-medium">{school.governmentId || t("noData")}</span>
                            </p>
                            <div className="mt-2 pt-4 border-t border-border/30 flex flex-col gap-2 text-sm">
                                <div className="flex justify-between items-center bg-secondary/20 p-2 rounded-md">
                                    <span className="text-muted-foreground font-medium">{t("statTotalStudents") || "Total students"}:</span>
                                    <span className="font-bold">{school.stats?.total || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-green-500/10 p-2 rounded-md">
                                    <span className="text-green-600 dark:text-green-400 font-medium">{t("statParticipate") || "Participate"}:</span>
                                    <span className="font-bold text-green-700 dark:text-green-300">{school.stats?.participated || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-red-500/10 p-2 rounded-md">
                                    <span className="text-red-500 font-medium">{t("statUnparticipate") || "Unparticipate"}:</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">{school.stats?.unparticipated || 0}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {schoolToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl border border-border/50 overflow-hidden relative p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4">
                            <AlertOctagon className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Delete School?</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Are you sure you want to delete <span className="font-semibold text-foreground">{schoolToDelete.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setSchoolToDelete(null)} disabled={deleting}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors disabled:opacity-50">
                                {t("cancel") || "Cancel"}
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Field Form Modal */}
            {showFieldForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border/50 overflow-hidden relative">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-semibold text-lg">
                                    {editingFieldId ? (t("edit") || "Edit") : (t("add") || "Add")} Custom Field
                                </h2>
                                <button onClick={() => setShowFieldForm(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                let newFields = [...form.customFields];
                                if (editingFieldId) {
                                    newFields = newFields.map(f => f.id === editingFieldId ? { ...fieldForm, id: editingFieldId } : f);
                                } else {
                                    newFields.push({ ...fieldForm, id: `customField_${Date.now()}` });
                                }
                                setForm({ ...form, customFields: newFields });
                                setShowFieldForm(false);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5">{t("label" as any) || "Field Label"}</label>
                                    <input type="text" required value={fieldForm.label} onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5">{t("type" as any) || "Field Type"}</label>
                                    <select value={fieldForm.type} onChange={e => setFieldForm({ ...fieldForm, type: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="text">Text Input</option>
                                        <option value="number">Number Input</option>
                                        <option value="select">Dropdown (Select)</option>
                                        <option value="radio">Radio Buttons</option>
                                    </select>
                                </div>
                                {(fieldForm.type === "select" || fieldForm.type === "radio") && (
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5">{t("options" as any) || "Options (comma-separated)"}</label>
                                        <input type="text" required value={fieldForm.options} onChange={e => setFieldForm({ ...fieldForm, options: e.target.value })}
                                            placeholder="Option A, Option B, Option C"
                                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        <p className="text-xs text-muted-foreground mt-1">Separate each option with a comma.</p>
                                    </div>
                                )}
                                <div>
                                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                                        <input type="checkbox" checked={fieldForm.allowExtraDescription} onChange={e => setFieldForm({ ...fieldForm, allowExtraDescription: e.target.checked })}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                                        <span>Have extra description field</span>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/30">
                                    <button type="button" onClick={() => setShowFieldForm(false)} className="px-5 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">{t("cancel")}</button>
                                    <button type="submit" className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
                                        {t("save") || "Save"}
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
