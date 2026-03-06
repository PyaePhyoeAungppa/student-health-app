"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, UserCog, Trash2 } from "lucide-react";
import { formatDateEn } from "@/lib/utils";

export default function UsersPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const currentUserId = (session?.user as any)?.id;

    const [users, setUsers] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [adding, setAdding] = useState(false);

    const [form, setForm] = useState({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "SCHOOL_STAFF",
        schoolId: "",
    });

    const fetchData = async () => {
        setLoading(true);
        const [uRes, sRes] = await Promise.all([
            fetch("/api/users"),
            fetch("/api/schools"),
        ]);
        const uData = await uRes.json();
        const sData = await sRes.json();
        setUsers(Array.isArray(uData) ? uData : []);
        setSchools(Array.isArray(sData) ? sData : []);
        setLoading(false);
    };

    useEffect(() => {
        if (role === "SYSTEM_ADMIN") {
            fetchData();
        } else {
            setLoading(false); // Quick fail if not admin
        }
    }, [role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);

        // Default system admin and company staff shouldn't be tied to a specific school
        const payload = { ...form };
        if (form.role !== "SCHOOL_STAFF") {
            payload.schoolId = "";
        }

        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setAdding(false);

        if (res.ok) {
            setForm({ username: "", password: "", fullName: "", email: "", role: "SCHOOL_STAFF", schoolId: "" });
            setShowAddForm(false);
            fetchData();
        } else {
            const data = await res.json();
            alert(`Error: ${data.error || "Failed to create user"}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchData();
        } else {
            const data = await res.json();
            alert(`Error: ${data.error || "Failed to delete user"}`);
        }
    };

    if (role !== "SYSTEM_ADMIN" && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
                <p className="text-muted-foreground text-sm">You must be a System Administrator to view this page.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">{users.length} staff members registered</p>
                </div>
                <button onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, hsl(199,89%,48%) 0%, hsl(262,83%,58%) 100%)" }}>
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            {showAddForm && (
                <div className="glass-card mb-6 animate-fade-in p-6">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Add New Staff User</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Username *</label>
                            <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Temporary Password *</label>
                            <input type="text" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Must be alphanumeric"
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Full Name</label>
                            <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Access Role *</label>
                            <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value, schoolId: e.target.value !== "SCHOOL_STAFF" ? "" : form.schoolId })}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                <option value="SCHOOL_STAFF">School Staff (Limited to one school)</option>
                                <option value="COMPANY_STAFF">Company Staff (Can manage all schools)</option>
                                <option value="SYSTEM_ADMIN">System Admin (Full Access)</option>
                            </select>
                        </div>
                        {form.role === "SCHOOL_STAFF" && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium mb-1.5">Assign School *</label>
                                <select required value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="">— Select School —</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="md:col-span-1 flex items-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-3 w-full rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors">Cancel</button>
                        </div>
                        <div className="md:col-span-1 flex items-end gap-3 mt-2">
                            <button type="submit" disabled={adding} className="px-4 py-3 w-full rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User / Name</th>
                                <th>Role</th>
                                <th>Assigned School</th>
                                <th>Date Added</th>
                                <th className="text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                </td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No users found.</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                                                <UserCog className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.username}</p>
                                                {user.fullName && <p className="text-xs text-muted-foreground">{user.fullName}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`text-xs px-2.5 py-1 rounded-full border ${user.role === "SYSTEM_ADMIN" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                            user.role === "COMPANY_STAFF" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                                "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                            }`}>
                                            {user.role.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td>
                                        {user.school ? (
                                            <span className="text-sm font-medium">{user.school.name}</span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Global Access</span>
                                        )}
                                    </td>
                                    <td className="text-sm text-muted-foreground">{formatDateEn(user.createdAt)}</td>
                                    <td className="text-right">
                                        {user.id !== currentUserId && (
                                            <button onClick={() => handleDelete(user.id)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete User">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
