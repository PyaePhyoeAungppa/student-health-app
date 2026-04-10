"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";

export default function ImportStudentsPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const router = useRouter();
    const { t } = useLanguage();

    const [file, setFile] = useState<File | null>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState("");
    const [searchSchoolTerm, setSearchSchoolTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") {
            fetch("/api/schools")
                .then(res => res.json())
                .then(data => setSchools(Array.isArray(data) ? data : (data.schools || [])));
        }
    }, [role]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(null);

        if (!file) {
            setError("Please select an Excel file.");
            return;
        }

        if ((role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && !selectedSchool) {
            setError("Please select a school to import students into.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        if (selectedSchool) formData.append("schoolId", selectedSchool);

        try {
            const res = await fetch("/api/students/import", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to import");

            setSuccess({
                studentsAdded: data.studentsAdded,
                recordsAdded: data.recordsAdded
            });
            setFile(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Link href="/dashboard/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Students
            </Link>

            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Import Student Data</h1>
                        <p className="text-sm text-muted-foreground mb-3">Upload the Thai Excel Template containing student records.</p>
                        <a href="/api/students/import/sample" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            {t("downloadSample" as any) || "Download Sample Excel"}
                        </a>
                    </div>
                </div>



                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium">Import Successful!</h3>
                            <p className="text-sm opacity-90 mt-1">
                                Added {success.studentsAdded} new students and {success.recordsAdded} health records.
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium">Import Failed</h3>
                            <p className="text-sm opacity-90 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleImport} className="space-y-6">
                    {(role === "SYSTEM_ADMIN" || role === "COMPANY_STAFF") && (
                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium">Target School *</label>
                            <input
                                type="text"
                                placeholder="Type to search school..."
                                value={searchSchoolTerm}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                onChange={e => {
                                    setSearchSchoolTerm(e.target.value);
                                    setSelectedSchool("");
                                    setShowDropdown(true);
                                }}
                                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required={!selectedSchool}
                            />
                            {showDropdown && (
                                <ul className="absolute z-10 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {schools.filter(s => s.name.toLowerCase().includes(searchSchoolTerm.toLowerCase())).map(school => (
                                        <li
                                            key={school.id}
                                            className="px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 text-foreground"
                                            onMouseDown={() => {
                                                setSelectedSchool(school.id);
                                                setSearchSchoolTerm(school.name);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            {school.name}
                                        </li>
                                    ))}
                                    {schools.filter(s => s.name.toLowerCase().includes(searchSchoolTerm.toLowerCase())).length === 0 && (
                                        <li className="px-4 py-3 text-sm text-muted-foreground text-center">No schools found</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Excel File (.xlsx) *</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="excel-upload"
                                required
                            />
                            <label
                                htmlFor="excel-upload"
                                className={`flex flex-col items-center justify-center w-full h-40 px-4 transition border-2 border-dashed rounded-xl appearance-none cursor-pointer hover:border-primary/50 hover:bg-secondary/50 ${file ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'}`}
                            >
                                <span className="flex items-center space-x-2">
                                    <Upload className={`w-6 h-6 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className="font-medium text-muted-foreground">
                                        {file ? file.name : "Click to select or drop an Excel file"}
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {loading ? "Importing Data..." : "Run Excel Import"}
                    </button>
                </form>
            </div>
        </div>
    );
}
