"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, FileText, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

const COLORS = ["#38bdf8", "#a78bfa", "#4ade80", "#fb923c", "#f43f5e", "#facc15", "#e879f9"];

export default function ReportsPage() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"dashboard" | "growth">("dashboard");
    const [growthSubTab, setGrowthSubTab] = useState<"wa" | "ha" | "wh">("wa");

    useEffect(() => {
        fetch("/api/reports")
            .then(r => r.json())
            .then(d => { setStats(d); setLoading(false); });
    }, []);

    const exportExcel = () => {
        window.location.href = "/api/reports?format=xlsx";
    };

    const exportCSV = () => {
        window.location.href = "/api/reports?format=csv";
    };

    const exportPDF = async () => {
        const jsPDF = (await import("jspdf")).default;
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(t("studentHealthReport"), 14, 20);
        doc.setFontSize(11);
        doc.text(`${t("generated")}: ${new Date().toLocaleDateString()}`, 14, 30);

        doc.setFontSize(13);
        doc.text(t("summary"), 14, 45);
        autoTable(doc, {
            startY: 50,
            head: [[t("metric"), t("value")]],
            body: [
                [t("totalStudents"), stats?.totalStudents ?? "—"],
                [t("activeRecords"), stats?.totalRecords ?? "—"],
                [t("bmi"), stats?.avgBmi ?? "—"],
                [t("underweight"), stats?.bmiDistribution?.underweight ?? "—"],
                [t("normalWeight"), stats?.bmiDistribution?.normal ?? "—"],
                [t("overweight"), stats?.bmiDistribution?.overweight ?? "—"],
                [t("obese"), stats?.bmiDistribution?.obese ?? "—"],
            ],
        });

        doc.text(t("hearingRecords"), 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [[t("healthStatus"), t("value")]],
            body: stats?.hearingStats?.map((h: any) => [h.hearingTest ? (t(h.hearingTest.toLowerCase() as any) || h.hearingTest) : "—", h._count]) ?? [],
        });

        doc.save("health_report.pdf");
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
            <div className="page-header flex flex-col sm:flex-row gap-4 mb-4">
                <div className="w-full sm:w-auto">
                    <h1 className="page-title">{t("reports")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">Comprehensive health data analysis</p>
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
                <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                    {language === "th" ? "แดชบอร์ดสถิติ" : "Statistics Dashboard"}
                </button>
                <button
                    onClick={() => setActiveTab("growth")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "growth" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                    {language === "th" ? "ตารางประเมินโภชนาการ" : "Growth Assessment Table"}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : activeTab === "dashboard" ? (
                <div className="space-y-6">
                    {/* Summary Row */}
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

                    {/* BMI Distribution Bar */}
                    <div className="glass-card p-6">
                        <h2 className="font-semibold mb-6 text-sm uppercase tracking-wider text-muted-foreground">{t("bmiDist")}</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bmiData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }}
                                    labelStyle={{ color: "#e2e8f0" }}
                                    itemStyle={{ color: "#94a3b8" }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {bmiData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Blood Type Pie */}
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

                        {/* Hearing & Color Pie */}
                        <div className="glass-card p-6 space-y-6">
                            <div>
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("hearingRecords")}</h2>
                                <ResponsiveContainer width="100%" height={100}>
                                    <BarChart data={hearingData} layout="vertical">
                                        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={80} />
                                        <Tooltip contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }} />
                                        <Bar dataKey="value" fill="#4ade80" radius={[0, 4, 4, 0]}>
                                            {hearingData.map((entry: any) => (
                                                <Cell key={entry.name} fill={entry.name === t("normal") ? "#4ade80" : "#f87171"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("colorVision")}</h2>
                                <ResponsiveContainer width="100%" height={100}>
                                    <BarChart data={colorBlindData} layout="vertical">
                                        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={80} />
                                        <Tooltip contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {colorBlindData.map((entry: any) => (
                                                <Cell key={entry.name} fill={entry.name === t("normal") ? "#4ade80" : "#f87171"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">{t("gender")}</h2>
                                <ResponsiveContainer width="100%" height={100}>
                                    <BarChart data={genderData} layout="vertical">
                                        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={60} />
                                        <Tooltip contentStyle={{ background: "hsl(222,47%,14%)", border: "1px solid hsl(222,40%,22%)", borderRadius: "8px" }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {genderData.map((entry: any) => (
                                                <Cell key={entry.name} fill={entry.name === t("male") ? "#38bdf8" : "#e879f9"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-base">{language === "th" ? "ตารางประเมินภาวะโภชนาการ (อ้างอิงเกณฑ์สถาบันโภชนาการ ม.มหิดล)" : "Nutrition Growth Assessment Tables (INMU-Mahidol Criteria)"}</h2>
                            <p className="text-xs text-muted-foreground mt-1">{language === "th" ? "ประเมินแยกตามน้ำหนักตามอายุ ส่วนสูงตามอายุ และน้ำหนักตามส่วนสูง" : "Evaluated separately by Weight-for-Age, Height-for-Age, and Weight-for-Height."}</p>
                        </div>
                        <div className="flex border border-border bg-secondary/10 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => setGrowthSubTab("wa")}
                                className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${growthSubTab === "wa" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {language === "th" ? "น้ำหนักตามอายุ (W/A)" : "Weight/Age (W/A)"}
                            </button>
                            <button
                                onClick={() => setGrowthSubTab("ha")}
                                className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${growthSubTab === "ha" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {language === "th" ? "ส่วนสูงตามอายุ (H/A)" : "Height/Age (H/A)"}
                            </button>
                            <button
                                onClick={() => setGrowthSubTab("wh")}
                                className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${growthSubTab === "wh" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {language === "th" ? "น้ำหนักตามส่วนสูง (W/H)" : "Weight/Height (W/H)"}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        {growthSubTab === "wa" && (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/50 text-muted-foreground">
                                        <th className="p-3 font-semibold">{language === "th" ? "ชื่อ - นามสกุล" : "Name"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ชั้น/ห้อง" : "Class/Room"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "เพศ" : "Gender"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "อายุ (เดือน)" : "Age (mo)"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "น้ำหนัก (กก.)" : "Wt (kg)"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ผลการแปลภาวะโภชนาการน้ำหนักตามอายุ (W/A)" : "Weight-for-Age Status (W/A)"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {stats?.studentGrowthData && stats.studentGrowthData.length > 0 ? (
                                        stats.studentGrowthData.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="p-3 font-medium text-foreground">{student.name}</td>
                                                <td className="p-3 text-center text-muted-foreground">{student.class}</td>
                                                <td className="p-3 text-center text-muted-foreground">
                                                    {student.gender === "Male" ? (language === "th" ? "ชาย" : "Male") : (language === "th" ? "หญิง" : "Female")}
                                                </td>
                                                <td className="p-3 text-center text-muted-foreground">
                                                    {student.ageMonths} {language === "th" ? "ด." : "mo"} ({student.ageYears} {language === "th" ? "ปี" : "y"})
                                                </td>
                                                <td className="p-3 text-center font-medium text-foreground">{student.weight}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        student.waLabel.includes("น้อย") || student.waLabel.includes("ขาด") ? "bg-blue-500/10 text-blue-400" :
                                                        student.waLabel.includes("ตามเกณฑ์") ? "bg-green-500/10 text-green-400" :
                                                        student.waLabel.includes("ค่อนข้าง") ? "bg-yellow-500/10 text-yellow-400" :
                                                        student.waLabel.includes("มาก") || student.waLabel.includes("อ้วน") ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {student.waZScore !== "—" ? `${student.waZScore} SD` : "—"} ({student.waLabel})
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                {language === "th" ? "ไม่พบข้อมูลนักเรียนในการประเมิน" : "No student data available."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {growthSubTab === "ha" && (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/50 text-muted-foreground">
                                        <th className="p-3 font-semibold">{language === "th" ? "ชื่อ - นามสกุล" : "Name"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ชั้น/ห้อง" : "Class/Room"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "เพศ" : "Gender"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "อายุ (เดือน)" : "Age (mo)"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ส่วนสูง (ซม.)" : "Ht (cm)"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ผลการแปลภาวะโภชนาการส่วนสูงตามอายุ (H/A)" : "Height-for-Age Status (H/A)"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {stats?.studentGrowthData && stats.studentGrowthData.length > 0 ? (
                                        stats.studentGrowthData.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="p-3 font-medium text-foreground">{student.name}</td>
                                                <td className="p-3 text-center text-muted-foreground">{student.class}</td>
                                                <td className="p-3 text-center text-muted-foreground">
                                                    {student.gender === "Male" ? (language === "th" ? "ชาย" : "Male") : (language === "th" ? "หญิง" : "Female")}
                                                </td>
                                                <td className="p-3 text-center text-muted-foreground">
                                                    {student.ageMonths} {language === "th" ? "ด." : "mo"} ({student.ageYears} {language === "th" ? "ปี" : "y"})
                                                </td>
                                                <td className="p-3 text-center font-medium text-foreground">{student.height}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        student.haLabel.includes("เตี้ย") ? "bg-blue-500/10 text-blue-400" :
                                                        student.haLabel.includes("ตามเกณฑ์") ? "bg-green-500/10 text-green-400" :
                                                        student.haLabel.includes("ค่อนข้างสูง") ? "bg-yellow-500/10 text-yellow-400" :
                                                        student.haLabel.includes("สูง") ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {student.haZScore !== "—" ? `${student.haZScore} SD` : "—"} ({student.haLabel})
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                {language === "th" ? "ไม่พบข้อมูลนักเรียนในการประเมิน" : "No student data available."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {growthSubTab === "wh" && (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/50 text-muted-foreground">
                                        <th className="p-3 font-semibold">{language === "th" ? "ชื่อ - นามสกุล" : "Name"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ชั้น/ห้อง" : "Class/Room"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "เพศ" : "Gender"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "น้ำหนัก (กก.)" : "Wt (kg)"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ส่วนสูง (ซม.)" : "Ht (cm)"}</th>
                                        <th className="p-3 font-semibold text-center">{language === "th" ? "ผลการแปลภาวะโภชนาการน้ำหนักตามส่วนสูง (W/H)" : "Weight-for-Height Status (W/H)"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {stats?.studentGrowthData && stats.studentGrowthData.length > 0 ? (
                                        stats.studentGrowthData.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="p-3 font-medium text-foreground">{student.name}</td>
                                                <td className="p-3 text-center text-muted-foreground">{student.class}</td>
                                                <td className="p-3 text-center text-muted-foreground">
                                                    {student.gender === "Male" ? (language === "th" ? "ชาย" : "Male") : (language === "th" ? "หญิง" : "Female")}
                                                </td>
                                                <td className="p-3 text-center font-medium text-foreground">{student.weight}</td>
                                                <td className="p-3 text-center font-medium text-foreground">{student.height}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        student.whLabel.includes("ผอม") ? "bg-blue-500/10 text-blue-400" :
                                                        student.whLabel.includes("สมส่วน") ? "bg-green-500/10 text-green-400" :
                                                        student.whLabel.includes("ท้วม") ? "bg-yellow-500/10 text-yellow-400" :
                                                        student.whLabel.includes("เริ่มอ้วน") || student.whLabel.includes("อ้วน") ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {student.whZScore !== "—" ? `${student.whZScore} SD` : "—"} ({student.whLabel})
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                {language === "th" ? "ไม่พบข้อมูลนักเรียนในการประเมิน" : "No student data available."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
