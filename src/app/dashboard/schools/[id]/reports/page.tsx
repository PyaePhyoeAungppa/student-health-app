"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useParams } from "next/navigation";
import Link from "next/link";

const COLORS = ["#38bdf8", "#a78bfa", "#4ade80", "#fb923c", "#f43f5e", "#facc15", "#e879f9"];

export default function SchoolReportsPage() {
    const params = useParams();
    const schoolId = params.id as string;
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [schoolName, setSchoolName] = useState("");
    const [activeTab, setActiveTab] = useState<"dashboard" | "growth">("dashboard");
    const [growthSubTab, setGrowthSubTab] = useState<"wa" | "ha" | "wh">("wa");

    useEffect(() => {
        fetch(`/api/schools/${schoolId}`)
            .then(r => r.json())
            .then(d => setSchoolName(d.name || ""))
            .catch(() => {});
    }, [schoolId]);

    useEffect(() => {
        fetch(`/api/reports?schoolId=${schoolId}`)
            .then(r => r.json())
            .then(d => { setStats(d); setLoading(false); });
    }, [schoolId]);

    const exportExcel = () => {
        window.location.href = `/api/reports?format=xlsx&schoolId=${schoolId}`;
    };

    const exportCSV = () => {
        window.location.href = `/api/reports?format=csv&schoolId=${schoolId}`;
    };

    const exportPDF = async () => {
        const jsPDF = (await import("jspdf")).default;
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(t("studentHealthReport"), 14, 20);
        doc.setFontSize(11);
        doc.text(`${schoolName} · ${t("generated")}: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.setFontSize(13);
        doc.text(t("summary"), 14, 45);
        autoTable(doc, {
            startY: 50,
            head: [[t("metric"), t("value")]],
            body: [
                [t("totalStudents"), stats?.totalStudents ?? "—"],
                [t("activeRecords"), stats?.totalRecords ?? "—"],
                [t("bmi"), stats?.avgBmi ?? "—"],
            ],
        });
        doc.save(`health_report_${schoolName}.pdf`);
    };

    const bmiData = stats?.bmiDistribution ? [
        { name: t("underweight"), value: stats.bmiDistribution.underweight || 0, color: "#60a5fa" },
        { name: t("normalWeight"), value: stats.bmiDistribution.normal || 0, color: "#4ade80" },
        { name: t("overweight"), value: stats.bmiDistribution.overweight || 0, color: "#facc15" },
        { name: t("obese"), value: stats.bmiDistribution.obese || 0, color: "#f87171" },
    ] : [];

    const bloodTypeData = stats?.bloodTypeStats?.map((b: any) => ({ name: b.bloodType || "—", value: b._count })) ?? [];
    const hearingData = stats?.hearingStats?.map((h: any) => ({ name: h.hearingTest ? (t(h.hearingTest.toLowerCase() as any) || h.hearingTest) : "—", value: h._count })) ?? [];
    const colorBlindData = stats?.colorBlindStats?.map((c: any) => ({ name: c.colorBlindness ? (t(c.colorBlindness.toLowerCase() as any) || c.colorBlindness) : "—", value: c._count })) ?? [];
    const genderData = stats?.genderStats?.map((g: any) => ({ name: g.gender ? (t(g.gender.toLowerCase() as any) || g.gender) : "—", value: g._count })) ?? [];

    return (
        <div>
            {/* Breadcrumb */}
            <div className="mb-2">
                <Link href={`/dashboard/schools/${schoolId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t("dashboard")}
                </Link>
            </div>

            <div className="page-header flex flex-col sm:flex-row gap-4 mb-4">
                <div className="w-full sm:w-auto">
                    <h1 className="page-title">{t("reports")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">📍 {schoolName}</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={exportExcel} disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto">
                        <Download className="w-4 h-4" /> {language === "th" ? "ส่งออกรายงานโภชนาการ (Excel)" : "Export Growth Excel"}
                    </button>
                    <button onClick={exportCSV} disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary border border-border hover:bg-secondary/80 transition-colors w-full sm:w-auto">
                        <Download className="w-4 h-4" /> {language === "th" ? "ส่งออก (CSV)" : "Export (CSV)"}
                    </button>
                    <button onClick={exportPDF} disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary border border-border hover:bg-secondary/80 transition-colors w-full sm:w-auto">
                        <FileText className="w-4 h-4" /> {t("export")}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-border mb-6">
                <button onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {language === "th" ? "แดชบอร์ดสถิติ" : "Statistics Dashboard"}
                </button>
                <button onClick={() => setActiveTab("growth")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "growth" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {language === "th" ? "ตารางประเมินโภชนาการ" : "Growth Assessment Table"}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : activeTab === "dashboard" ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "totalStudents", value: stats?.totalStudents },
                            { label: "activeRecords", value: stats?.totalRecords },
                            { label: "bmi", value: stats?.avgBmi },
                            { label: "normalWeight", value: `${stats?.totalRecords ? Math.round((stats.bmiDistribution.normal / stats.totalRecords) * 100) : 0}%` },
                        ].map(({ label, value }) => (
                            <div key={label} className="glass-card p-5 text-center">
                                <p className="text-3xl font-bold gradient-text">{value ?? "—"}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t(label as any)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="font-semibold mb-6 text-sm uppercase tracking-wider text-muted-foreground">{t("bmiDist")}</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bmiData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#94a3b8" }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {bmiData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h2 className="font-semibold mb-6 text-sm uppercase tracking-wider text-muted-foreground">{t("bloodTypeDist")}</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={bloodTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                                        {bloodTypeData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="glass-card p-6 space-y-6">
                            {[
                                { title: t("hearingRecords"), data: hearingData },
                                { title: t("colorVision"), data: colorBlindData },
                                { title: t("gender"), data: genderData },
                            ].map(({ title, data }) => (
                                <div key={title}>
                                    <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{title}</h2>
                                    <ResponsiveContainer width="100%" height={90}>
                                        <BarChart data={data} layout="vertical">
                                            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                            <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={80} />
                                            <Tooltip contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {data.map((entry: any, i: number) => (
                                                    <Cell key={i} fill={
                                                        entry.name === t("normal") || entry.name === t("male") ? "#4ade80" :
                                                        entry.name === t("female") ? "#e879f9" : "#f87171"
                                                    } />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-base">{language === "th" ? "ตารางประเมินภาวะโภชนาการ" : "Nutrition Growth Assessment Tables"}</h2>
                            <p className="text-xs text-muted-foreground mt-1">{language === "th" ? "ประเมินแยกตามน้ำหนักตามอายุ ส่วนสูงตามอายุ และน้ำหนักตามส่วนสูง" : "Evaluated by Weight-for-Age, Height-for-Age, and Weight-for-Height."}</p>
                        </div>
                        <div className="flex border border-border bg-secondary/10 p-1 rounded-lg w-fit">
                            {(["wa", "ha", "wh"] as const).map(tab => (
                                <button key={tab} onClick={() => setGrowthSubTab(tab)}
                                    className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${growthSubTab === tab ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                                    {tab === "wa" ? (language === "th" ? "น้ำหนักตามอายุ (W/A)" : "Weight/Age") :
                                     tab === "ha" ? (language === "th" ? "ส่วนสูงตามอายุ (H/A)" : "Height/Age") :
                                     (language === "th" ? "น้ำหนักตามส่วนสูง (W/H)" : "Weight/Height")}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-secondary/50 text-muted-foreground">
                                    <th className="p-3 font-semibold">{language === "th" ? "ชื่อ - นามสกุล" : "Name"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "ชั้น/ห้อง" : "Class/Room"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "เพศ" : "Gender"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "อายุ (เดือน)" : "Age (mo)"}</th>
                                    <th className="p-3 font-semibold text-center">
                                        {growthSubTab === "wa" ? (language === "th" ? "น้ำหนัก (กก.)" : "Wt (kg)") :
                                         growthSubTab === "ha" ? (language === "th" ? "ส่วนสูง (ซม.)" : "Ht (cm)") :
                                         (language === "th" ? "น้ำหนัก/ส่วนสูง" : "Wt/Ht")}
                                    </th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "ผลการประเมิน" : "Status"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {stats?.studentGrowthData && stats.studentGrowthData.length > 0 ? (
                                    stats.studentGrowthData.map((student: any) => {
                                        const label = growthSubTab === "wa" ? student.waLabel : growthSubTab === "ha" ? student.haLabel : student.whLabel;
                                        const zScore = growthSubTab === "wa" ? student.waZScore : growthSubTab === "ha" ? student.haZScore : student.whZScore;
                                        const mainVal = growthSubTab === "wa" ? student.weight : growthSubTab === "ha" ? student.height : `${student.weight}/${student.height}`;
                                        return (
                                            <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="p-3 font-medium">{student.name}</td>
                                                <td className="p-3 text-center text-muted-foreground">{student.class}</td>
                                                <td className="p-3 text-center text-muted-foreground">{student.gender === "Male" ? (language === "th" ? "ชาย" : "Male") : (language === "th" ? "หญิง" : "Female")}</td>
                                                <td className="p-3 text-center text-muted-foreground">{student.ageMonths} {language === "th" ? "ด." : "mo"}</td>
                                                <td className="p-3 text-center font-medium">{mainVal}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        label?.includes("ตามเกณฑ์") || label?.includes("สมส่วน") ? "bg-green-500/10 text-green-400" :
                                                        label?.includes("ค่อนข้าง") || label?.includes("ท้วม") ? "bg-yellow-500/10 text-yellow-400" :
                                                        label?.includes("มาก") || label?.includes("อ้วน") ? "bg-red-500/10 text-red-400" :
                                                        "bg-blue-500/10 text-blue-400"
                                                    }`}>
                                                        {zScore !== "—" ? `${zScore} SD` : "—"} ({label})
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{language === "th" ? "ไม่พบข้อมูลนักเรียน" : "No student data available."}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
