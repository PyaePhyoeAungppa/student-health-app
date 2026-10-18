"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NutritionStandardManager } from "@/components/dashboard/nutrition-standard-manager";
import { AssessmentOverrideManager } from "@/components/dashboard/assessment-override-manager";

const COLORS = ["#38bdf8", "#a78bfa", "#4ade80", "#fb923c", "#f43f5e", "#facc15", "#e879f9"];

export default function SchoolReportsPage() {
    const params = useParams();
    const schoolId = params.id as string;
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [schoolName, setSchoolName] = useState("");
    const [activeTab, setActiveTab] = useState<"dashboard" | "growth" | "standards" | "overrides">("dashboard");
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
        const doc = new jsPDF({ orientation: "landscape" });
        const pageW = doc.internal.pageSize.getWidth();
        const now = new Date().toLocaleDateString("en-GB");
        const safeSchoolName = schoolName.replace(/[^\x20-\x7E]/g, "").trim() || "School";

        // --- Load Thai font so student names render correctly ---
        try {
            const fontRes = await fetch("/fonts/Sarabun-Regular.ttf");
            const fontBuf = await fontRes.arrayBuffer();
            const base64 = btoa(Array.from(new Uint8Array(fontBuf), b => String.fromCharCode(b)).join(""));
            doc.addFileToVFS("Sarabun-Regular.ttf", base64);
            doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
            doc.setFont("Sarabun");
        } catch { /* fallback to helvetica */ }

        // --- Cover header ---
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageW, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text(`Student Health & Nutrition Report`, pageW / 2, 11, { align: "center" });
        doc.setFontSize(10);
        doc.text(`${safeSchoolName}  |  Generated: ${now}`, pageW / 2, 22, { align: "center" });
        doc.setTextColor(30, 41, 59);

        // --- Summary stats ---
        let y = 38;
        doc.setFontSize(12);
        doc.text("Summary", 14, y);
        y += 4;
        autoTable(doc, {
            startY: y,
            head: [["Metric", "Value"]],
            body: [
                ["Total Students", stats?.totalStudents ?? "—"],
                ["Health Records", stats?.totalRecords ?? "—"],
                ["Average BMI", stats?.avgBmi ?? "—"],
                ["Underweight (BMI)", stats?.bmiDistribution?.underweight ?? 0],
                ["Normal Weight (BMI)", stats?.bmiDistribution?.normal ?? 0],
                ["Overweight (BMI)", stats?.bmiDistribution?.overweight ?? 0],
                ["Obese (BMI)", stats?.bmiDistribution?.obese ?? 0],
            ],
            styles: { fontSize: 9, cellPadding: 2, font: "Sarabun" },
            headStyles: { fillColor: [56, 189, 248], textColor: 255, fontStyle: "bold" },
            columnStyles: { 0: { fontStyle: "bold" } },
            margin: { left: 14, right: 14 },
        });

        // --- Distribution tables side-by-side ---
        const afterSummary = (doc as any).lastAutoTable.finalY + 6;
        const colW = (pageW - 42) / 4;

        const distSections = [
            { title: "Hearing Test", data: stats?.hearingStats?.map((h: any) => [h.hearingTest || "—", h._count]) ?? [] },
            { title: "Color Vision",  data: stats?.colorBlindStats?.map((c: any) => [c.colorBlindness || "—", c._count]) ?? [] },
            { title: "Blood Type",    data: stats?.bloodTypeStats?.map((b: any) => [b.bloodType || "—", b._count]) ?? [] },
            { title: "Gender",        data: stats?.genderStats?.map((g: any) => [g.gender || "—", g._count]) ?? [] },
        ];

        distSections.forEach((sec, idx) => {
            const x = 14 + idx * (colW + 5);
            doc.setFontSize(9);
            doc.text(sec.title, x, afterSummary + 4);
            autoTable(doc, {
                startY: afterSummary + 6,
                head: [["Category", "Count"]],
                body: sec.data.length > 0 ? sec.data : [["No data", "—"]],
                styles: { fontSize: 8, cellPadding: 1.5, font: "Sarabun" },
                headStyles: { fillColor: [167, 139, 250], textColor: 255 },
                margin: { left: x, right: pageW - x - colW },
                tableWidth: colW,
            });
        });

        // --- Student Growth Assessment Table (page 2) ---
        doc.addPage();
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageW, 16, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.text("Student Nutrition Growth Assessment", pageW / 2, 11, { align: "center" });
        doc.setTextColor(30, 41, 59);

        const waLabelMap: Record<string, string> = {
            "\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01\u0e21\u0e32\u0e01\u0e01\u0e27\u0e48\u0e32\u0e40\u0e01\u0e13\u0e11\u0e4c": "Above Standard",
            "\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01\u0e04\u0e48\u0e2d\u0e19\u0e02\u0e49\u0e32\u0e07\u0e21\u0e32\u0e01": "Relatively High",
            "\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01\u0e15\u0e32\u0e21\u0e40\u0e01\u0e13\u0e11\u0e4c": "Within Standard",
            "\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01\u0e04\u0e48\u0e2d\u0e19\u0e02\u0e49\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22": "Relatively Low",
            "\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01\u0e19\u0e49\u0e2d\u0e22\u0e01\u0e27\u0e48\u0e32\u0e40\u0e01\u0e13\u0e11\u0e4c": "Below Standard",
        };
        const haLabelMap: Record<string, string> = {
            "\u0e2a\u0e39\u0e07\u0e01\u0e27\u0e48\u0e32\u0e40\u0e01\u0e13\u0e11\u0e4c": "Above Standard",
            "\u0e04\u0e48\u0e2d\u0e19\u0e02\u0e49\u0e32\u0e07\u0e2a\u0e39\u0e07": "Relatively Tall",
            "\u0e2a\u0e48\u0e27\u0e19\u0e2a\u0e39\u0e07\u0e15\u0e32\u0e21\u0e40\u0e01\u0e13\u0e11\u0e4c": "Standard Height",
            "\u0e04\u0e48\u0e2d\u0e19\u0e02\u0e49\u0e32\u0e07\u0e40\u0e15\u0e35\u0e49\u0e22": "Relatively Short",
            "\u0e40\u0e15\u0e35\u0e49\u0e22": "Short",
        };
        const whLabelMap: Record<string, string> = {
            "\u0e2d\u0e49\u0e27\u0e19": "Obese",
            "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e2d\u0e49\u0e27\u0e19": "Overweight",
            "\u0e17\u0e49\u0e27\u0e21": "Plump",
            "\u0e2a\u0e21\u0e2a\u0e48\u0e27\u0e19": "Proportionate",
            "\u0e04\u0e48\u0e2d\u0e19\u0e02\u0e49\u0e32\u0e07\u0e1c\u0e2d\u0e21": "Relatively Thin",
            "\u0e1c\u0e2d\u0e21": "Thin",
        };

        const growthRows = (stats?.studentGrowthData ?? []).map((s: any, i: number) => [
            i + 1,
            s.name,
            s.class || "—",
            s.gender === "Male" ? "M" : "F",
            s.ageYears != null ? `${s.ageYears}y` : "—",
            s.weight !== "—" ? s.weight : "—",
            s.height !== "—" ? s.height : "—",
            s.bmi != null ? Number(s.bmi).toFixed(2) : "—",
            waLabelMap[s.waLabel] ?? s.waLabel ?? "—",
            haLabelMap[s.haLabel] ?? s.haLabel ?? "—",
            whLabelMap[s.whLabel] ?? s.whLabel ?? "—",
        ]);

        autoTable(doc, {
            startY: 22,
            head: [["#", "Name", "Class", "Sex", "Age", "Wt(kg)", "Ht(cm)", "BMI", "W/A", "H/A", "W/H"]],
            body: growthRows.length > 0 ? growthRows : [["—", "No student data available", "", "", "", "", "", "", "", "", ""]],
            styles: { fontSize: 7.5, cellPadding: 1.8, overflow: "ellipsize", font: "Sarabun" },
            headStyles: { fillColor: [56, 189, 248], textColor: 255, fontStyle: "bold", fontSize: 8, font: "Sarabun" },
            alternateRowStyles: { fillColor: [241, 245, 249] },
            columnStyles: {
                0: { cellWidth: 8, halign: "center" },
                1: { cellWidth: 50 },
                2: { cellWidth: 18, halign: "center" },
                3: { cellWidth: 10, halign: "center" },
                4: { cellWidth: 20, halign: "center" },
                5: { cellWidth: 16, halign: "center" },
                6: { cellWidth: 14, halign: "center" },
                7: { cellWidth: 14, halign: "center" },
                8: { cellWidth: 32 },
                9: { cellWidth: 32 },
                10: { cellWidth: 32 },
            },
            margin: { left: 10, right: 10 },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index >= 8) {
                    const v = String(data.cell.raw);
                    if (v === "Above Standard" || v === "Obese") data.cell.styles.textColor = [239, 68, 68];
                    else if (v === "Within Standard" || v === "Standard Height" || v === "Proportionate") data.cell.styles.textColor = [34, 197, 94];
                    else if (v === "Below Standard" || v === "Short" || v === "Thin") data.cell.styles.textColor = [96, 165, 250];
                    else if (v !== "—") data.cell.styles.textColor = [234, 179, 8];
                }
            },
        });

        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${totalPages}  |  Student Health System`, pageW - 14, doc.internal.pageSize.getHeight() - 5, { align: "right" });
        }

        doc.save(`health_report_${safeSchoolName}_${new Date().toISOString().slice(0, 10)}.pdf`);
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
                        <FileText className="w-4 h-4" /> {language === "th" ? "ส่งออก PDF" : "Export PDF"}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap border-b border-border mb-6">
                <button onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {language === "th" ? "แดชบอร์ดสถิติ" : "Statistics Dashboard"}
                </button>
                <button onClick={() => setActiveTab("growth")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "growth" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {language === "th" ? "ตารางประเมินโภชนาการ" : "Growth Assessment Table"}
                </button>
                <button onClick={() => setActiveTab("overrides")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "overrides" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {language === "th" ? "นำเข้า/แก้ไขผลประเมิน" : "Import & Edit Assessments"}
                </button>
                <button onClick={() => setActiveTab("standards")}
                    className={`px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${activeTab === "standards" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {language === "th" ? "ตั้งค่าตารางคำนวณโภชนาการ" : "Nutrition Table Manager"}
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
            ) : activeTab === "growth" ? (
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="font-semibold text-base">{language === "th" ? "ตารางประเมินภาวะโภชนาการ" : "Nutrition Growth Assessment Tables"}</h2>
                        <p className="text-xs text-muted-foreground mt-1">{language === "th" ? "แสดงผลพร้อมกันทั้ง 3 หัวข้อ: น้ำหนักตามเกณฑ์อายุ (W/A), ส่วนสูงตามเกณฑ์อายุ (H/A), และน้ำหนักตามเกณฑ์ส่วนสูง (W/H)" : "All three assessments shown simultaneously: Weight-for-Age (W/A), Height-for-Age (H/A), and Weight-for-Height (W/H)."}</p>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b-2 border-border bg-secondary/50 text-muted-foreground text-xs">
                                    <th className="p-3 font-semibold">{language === "th" ? "ชื่อ - นามสกุล" : "Name"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "ชั้น/ห้อง" : "Class"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "เพศ" : "Gender"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "อายุ" : "Age"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "น้ำหนัก (กก.)" : "Wt (kg)"}</th>
                                    <th className="p-3 font-semibold text-center">{language === "th" ? "ส่วนสูง (ซม.)" : "Ht (cm)"}</th>
                                    <th className="p-3 font-semibold text-center">BMI</th>
                                    <th className="p-3 font-semibold text-center min-w-[170px] border-l-2 border-primary/30 bg-primary/5">
                                        <div className="text-primary/90 font-bold">{language === "th" ? "น้ำหนักตามเกณฑ์อายุ" : "Weight-for-Age"}</div>
                                        <div className="text-[10px] font-normal opacity-60">W/A</div>
                                    </th>
                                    <th className="p-3 font-semibold text-center min-w-[170px] border-l-2 border-purple-400/30 bg-purple-500/5">
                                        <div className="text-purple-400 font-bold">{language === "th" ? "ส่วนสูงตามเกณฑ์อายุ" : "Height-for-Age"}</div>
                                        <div className="text-[10px] font-normal opacity-60">H/A</div>
                                    </th>
                                    <th className="p-3 font-semibold text-center min-w-[170px] border-l-2 border-emerald-400/30 bg-emerald-500/5">
                                        <div className="text-emerald-400 font-bold">{language === "th" ? "น้ำหนักตามเกณฑ์ส่วนสูง" : "Weight-for-Height"}</div>
                                        <div className="text-[10px] font-normal opacity-60">W/H</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {stats?.studentGrowthData && stats.studentGrowthData.length > 0 ? (
                                    stats.studentGrowthData.map((student: any) => {
                                        const waColor = student.waLabel === "น้ำหนักน้อยกว่าเกณฑ์" ? "bg-blue-500/10 text-blue-400" : student.waLabel === "น้ำหนักค่อนข้างน้อย" ? "bg-yellow-500/10 text-yellow-400" : student.waLabel === "น้ำหนักตามเกณฑ์" ? "bg-green-500/10 text-green-400" : student.waLabel === "น้ำหนักค่อนข้างมาก" ? "bg-orange-500/10 text-orange-400" : student.waLabel === "น้ำหนักมากกว่าเกณฑ์" ? "bg-red-500/10 text-red-400" : "bg-muted/40 text-muted-foreground";
                                        const haColor = student.haLabel === "เตี้ย" ? "bg-blue-500/10 text-blue-400" : student.haLabel === "ค่อนข้างเตี้ย" ? "bg-yellow-500/10 text-yellow-400" : student.haLabel === "ส่วนสูงตามเกณฑ์" ? "bg-green-500/10 text-green-400" : student.haLabel === "ค่อนข้างสูง" ? "bg-yellow-500/10 text-yellow-400" : student.haLabel === "สูงกว่าเกณฑ์" ? "bg-red-500/10 text-red-400" : "bg-muted/40 text-muted-foreground";
                                        const whColor = student.whLabel === "ผอม" ? "bg-blue-500/10 text-blue-400" : student.whLabel === "ค่อนข้างผอม" ? "bg-yellow-500/10 text-yellow-400" : student.whLabel === "สมส่วน" ? "bg-green-500/10 text-green-400" : student.whLabel === "ท้วม" || student.whLabel === "เริ่มอ้วน" ? "bg-orange-500/10 text-orange-400" : student.whLabel === "อ้วน" ? "bg-red-500/10 text-red-400" : "bg-muted/40 text-muted-foreground";
                                        const waEN = student.waLabel === "น้ำหนักมากกว่าเกณฑ์" ? "Above the Standard Weight" : student.waLabel === "น้ำหนักค่อนข้างมาก" ? "Relatively High Weight" : student.waLabel === "น้ำหนักตามเกณฑ์" ? "Weight Within the Standard" : student.waLabel === "น้ำหนักค่อนข้างน้อย" ? "Relatively Low Weight" : student.waLabel === "น้ำหนักน้อยกว่าเกณฑ์" ? "Below the Standard Weight" : "";
                                        const haEN = student.haLabel === "สูงกว่าเกณฑ์" ? "Above Standard Height" : student.haLabel === "ค่อนข้างสูง" ? "Relatively Tall" : student.haLabel === "ส่วนสูงตามเกณฑ์" ? "Standard Height" : student.haLabel === "ค่อนข้างเตี้ย" ? "Relatively Short" : student.haLabel === "เตี้ย" ? "Short" : "";
                                        const whEN = student.whLabel === "อ้วน" ? "Obese" : student.whLabel === "เริ่มอ้วน" ? "Overweight" : student.whLabel === "ท้วม" ? "Plump" : student.whLabel === "สมส่วน" ? "Proportionate" : student.whLabel === "ค่อนข้างผอม" ? "Relatively Thin" : student.whLabel === "ผอม" ? "Thin" : "";
                                        return (
                                            <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="p-3 font-medium text-sm">{student.name}</td>
                                                <td className="p-3 text-center text-muted-foreground text-xs">{student.class}</td>
                                                <td className="p-3 text-center text-muted-foreground text-xs">{student.gender === "Male" ? (language === "th" ? "ชาย" : "Male") : (language === "th" ? "หญิง" : "Female")}</td>
                                                <td className="p-3 text-center text-muted-foreground text-xs">{student.ageYears} {language === "th" ? "ปี" : "y"}</td>
                                                <td className="p-3 text-center font-medium text-xs">{student.weight}</td>
                                                <td className="p-3 text-center font-medium text-xs">{student.height}</td>
                                                <td className="p-3 text-center font-medium text-xs">
                                                    {student.bmi != null ? (
                                                        <span className={student.bmi < 18.5 ? "text-blue-400" : student.bmi < 25 ? "text-green-400" : student.bmi < 30 ? "text-yellow-400" : "text-red-400"}>
                                                            {Number(student.bmi).toFixed(2)}
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                                <td className="p-2 text-center border-l-2 border-primary/10">
                                                    <span className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold w-full ${waColor}`}>
                                                        <span>{student.waLabel || "—"}</span>
                                                        {waEN && <span className="font-normal opacity-70 text-[10px] leading-tight">{waEN}</span>}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-center border-l-2 border-purple-400/10">
                                                    <span className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold w-full ${haColor}`}>
                                                        <span>{student.haLabel || "—"}</span>
                                                        {haEN && <span className="font-normal opacity-70 text-[10px] leading-tight">{haEN}</span>}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-center border-l-2 border-emerald-400/10">
                                                    <span className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold w-full ${whColor}`}>
                                                        <span>{student.whLabel || "—"}</span>
                                                        {whEN && <span className="font-normal opacity-70 text-[10px] leading-tight">{whEN}</span>}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">{language === "th" ? "ไม่พบข้อมูลนักเรียน" : "No student data available."}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === "overrides" ? (
                <AssessmentOverrideManager
                    schoolId={schoolId}
                    calculatedData={stats?.studentGrowthData ?? []}
                />
            ) : (
                <NutritionStandardManager initialSchoolId={schoolId} />
            )}
        </div>
    );
}
