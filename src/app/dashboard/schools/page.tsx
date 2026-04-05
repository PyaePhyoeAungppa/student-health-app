"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Building2, Edit, Trash2, X, AlertOctagon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

const THAI_PROVINCES = [
    "กระบี่", "กรุงเทพมหานคร", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี",
    "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
    "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
    "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี",
    "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี",
    "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด",
    "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร",
    "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
    "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง",
    "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

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
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const [form, setForm] = useState({ name: "", province: "", address: "" });

    const openAddForm = () => {
        setForm({ name: "", province: "", address: "" });
        setEditingId(null);
        setShowAddForm(true);
    };

    const handleEdit = (school: any) => {
        setForm({ name: school.name, province: school.province || "", address: school.address || "" });
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
            setForm({ name: "", province: "", address: "" });
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
                        style={{ background: "linear-gradient(135deg, hsl(150,60%,45%) 0%, hsl(25, 85%, 55%) 100%)" }}>
                        <Plus className="w-4 h-4" /> {t("addSchool")}
                    </button>
                )}
            </div>

            {showAddForm && role === "SYSTEM_ADMIN" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background w-full max-w-lg rounded-2xl shadow-2xl border border-border/50 overflow-hidden relative">
                        <div className="p-6">
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
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1.5">{t("province")}</label>
                                    <input type="text" value={form.province} 
                                        onChange={e => {
                                            setForm({ ...form, province: e.target.value });
                                            setShowProvinceDropdown(true);
                                        }}
                                        onFocus={() => setShowProvinceDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowProvinceDropdown(false), 200)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    {showProvinceDropdown && (
                                        <ul className="absolute z-10 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {THAI_PROVINCES.filter(p => !form.province || p.includes(form.province)).map(p => (
                                                <li key={p} className="px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 text-foreground"
                                                    onMouseDown={() => {
                                                        setForm({...form, province: p});
                                                        setShowProvinceDropdown(false);
                                                    }}>
                                                    {p}
                                                </li>
                                            ))}
                                            {THAI_PROVINCES.filter(p => !form.province || p.includes(form.province)).length === 0 && (
                                                <li className="px-4 py-3 text-sm text-muted-foreground text-center">No matching province</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1.5">{t("address")}</label>
                                    <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
        </div>
    );
}
