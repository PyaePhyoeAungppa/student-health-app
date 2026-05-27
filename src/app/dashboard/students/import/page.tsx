"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Download, ShieldCheck } from "lucide-react";
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
    const [warnings, setWarnings] = useState<any[]>([]);
    const [skippedCount, setSkippedCount] = useState(0);
    const [errorFileBase64, setErrorFileBase64] = useState("");
    const [errorFileName, setErrorFileName] = useState("");
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
        setWarnings([]);
        setSkippedCount(0);
        setErrorFileBase64("");
        setErrorFileName("");

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
            setWarnings(data.warnings || []);
            setSkippedCount(data.skippedCount || 0);
            setErrorFileBase64(data.errorFileBase64 || "");
            setErrorFileName(data.errorFileName || "");
            setFile(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadIncorrect = () => {
        if (!errorFileBase64) return;
        try {
            const byteCharacters = atob(errorFileBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = errorFileName || "incorrect-student-records.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download file", err);
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
                    <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-start gap-3 animate-fade-in">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-sm">{t("importCompleted" as any)}</h3>
                            <p className="text-xs opacity-90 mt-1">
                                {t("importSuccessDetail" as any)
                                    .replace("{added}", success.studentsAdded)
                                    .replace("{records}", success.recordsAdded)}
                            </p>
                            {skippedCount > 0 && (
                                <p className="text-xs text-amber-600 font-semibold mt-1">
                                    {t("importSkippedWarning" as any).replace("{count}", String(skippedCount))}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium">{t("importFailed" as any)}</h3>
                            <p className="text-sm opacity-90 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Warnings / Abnormal Data Review Panel */}
                {skippedCount > 0 && (
                    <div className="mb-6 p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in">
                        <div className="flex items-center gap-2 mb-3 text-amber-700">
                            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                            <h3 className="font-bold text-sm">
                                {t("skippedRowsTitle" as any).replace("{count}", String(skippedCount))}
                            </h3>
                        </div>
                        <p className="text-xs text-amber-800 mb-4 leading-relaxed font-medium">
                            {t("skippedRowsExplanation" as any)}
                        </p>

                        {errorFileBase64 && (
                            <button
                                onClick={handleDownloadIncorrect}
                                className="mb-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-xs"
                                style={{ background: "linear-gradient(135deg, hsl(35, 100%, 50%) 0%, hsl(20, 95%, 45%) 100%)" }}
                            >
                                <Download className="w-4 h-4 animate-bounce" />
                                {t("downloadIncorrectRows" as any)}
                            </button>
                        )}
                        
                        <div className="overflow-x-auto rounded-lg border border-border/50 bg-black/10">
                            <table className="w-full text-xs text-left min-w-[550px]">
                                <thead className="bg-secondary text-muted-foreground font-semibold border-b border-border/30">
                                    <tr>
                                        <th className="px-3 py-2 text-center w-16">{t("tableRowHeader" as any)}</th>
                                        <th className="px-3 py-2">{t("tableStudentHeader" as any)}</th>
                                        <th className="px-3 py-2 w-32">{t("tableFieldHeader" as any)}</th>
                                        <th className="px-3 py-2 text-right w-24">{t("tableValueHeader" as any)}</th>
                                        <th className="px-3 py-2 pl-4">{t("tableReasonHeader" as any)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {warnings.map((warn, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">{warn.row}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-semibold">{warn.name}</div>
                                                <div className="text-[10px] text-muted-foreground">ID: {warn.studentId}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-amber-400 font-medium">{warn.field}</td>
                                            <td className="px-3 py-2.5 text-right font-semibold text-red-400">{warn.value}</td>
                                            <td className="px-3 py-2.5 pl-4 text-muted-foreground">{warn.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
