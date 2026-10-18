"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { Upload, Download, Save, RefreshCw, CheckCircle2, FileSpreadsheet, Loader2, AlertCircle, Building2 } from "lucide-react";
import * as XLSX from "xlsx";

interface SchoolOption {
    id: string;
    name: string;
}

interface NutritionStandardManagerProps {
    initialSchoolId?: string;
}

export function NutritionStandardManager({ initialSchoolId }: NutritionStandardManagerProps) {
    const { t, language } = useLanguage();
    const [schools, setSchools] = useState<SchoolOption[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>(initialSchoolId || "");
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [standardType, setStandardType] = useState<"INMU_MAHIDOL" | "CUSTOM">("INMU_MAHIDOL");
    const [defaultData, setDefaultData] = useState<any>(null);
    const [customData, setCustomData] = useState<any>(null);
    const [subTab, setSubTab] = useState<"wa" | "ha" | "wh">("wa");
    const [genderFilter, setGenderFilter] = useState<1 | 2>(1); // 1 = Male, 2 = Female
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Fetch schools list if initialSchoolId is not provided
    useEffect(() => {
        if (!initialSchoolId) {
            fetch("/api/schools")
                .then(r => r.json())
                .then((data: any[]) => {
                    if (Array.isArray(data) && data.length > 0) {
                        setSchools(data.map(s => ({ id: s.id, name: s.name })));
                        setSelectedSchoolId(data[0].id);
                    }
                })
                .catch(() => {});
        }
    }, [initialSchoolId]);

    // Load standards for selected school
    const loadSchoolStandards = (schoolId: string) => {
        if (!schoolId) return;
        setLoading(true);
        setStatusMessage(null);
        fetch(`/api/schools/${schoolId}/growth-standards`)
            .then(r => r.json())
            .then(data => {
                setLoading(false);
                if (data.nutritionStandardType) {
                    setStandardType(data.nutritionStandardType);
                }
                setDefaultData(data.defaultGrowthStandards);
                setCustomData(data.customGrowthStandards);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const growthData = standardType === "CUSTOM" && customData ? customData : defaultData;

    useEffect(() => {
        if (selectedSchoolId) {
            loadSchoolStandards(selectedSchoolId);
        }
    }, [selectedSchoolId]);

    // Handle saving standards to API
    const handleSave = async () => {
        if (!selectedSchoolId) return;
        setSaving(true);
        setStatusMessage(null);
        try {
            const res = await fetch(`/api/schools/${selectedSchoolId}/growth-standards`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nutritionStandardType: standardType,
                    customGrowthStandards: customData,
                }),
            });
            const data = await res.json();
            setSaving(false);
            if (res.ok) {
                setStatusMessage({
                    type: "success",
                    text: language === "th"
                        ? "บันทึกตารางประเมินโภชนาการสำหรับโรงเรียนเรียบร้อยแล้ว"
                        : "Nutrition Assessment Table saved successfully for the school."
                });
            } else {
                setStatusMessage({
                    type: "error",
                    text: data.error || (language === "th" ? "เกิดข้อผิดพลาดในการบันทึก" : "Failed to save standard.")
                });
            }
        } catch (err) {
            setSaving(false);
            setStatusMessage({
                type: "error",
                text: language === "th" ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : "Network error occurred."
            });
        }
    };

    // Export current active standards as template Excel
    const handleDownloadTemplate = () => {
        if (!growthData) return;
        const wb = XLSX.utils.book_new();

        // Sheet 1: W/A
        const waRows = (growthData.waTable || []).map((r: any) => {
            const isMale = r.sexAge < 2000;
            const ageMonths = r.sexAge % 1000;
            return {
                "Sex (1=Male, 2=Female)": isMale ? 1 : 2,
                "Age (Months)": ageMonths,
                "sexAge": r.sexAge,
                "-3SD": r.values[0],
                "-2SD": r.values[1],
                "-1.5SD": r.values[2],
                "-1SD": r.values[3],
                "Median": r.values[4],
                "+1SD": r.values[5],
                "+1.5SD": r.values[6],
                "+2SD": r.values[7],
                "+3SD": r.values[8],
            };
        });
        const waWs = XLSX.utils.json_to_sheet(waRows);
        XLSX.utils.book_append_sheet(wb, waWs, "Weight-for-Age (WA)");

        // Sheet 2: H/A
        const haRows = (growthData.haTable || []).map((r: any) => {
            const isMale = r.sexAge < 2000;
            const ageMonths = r.sexAge % 1000;
            return {
                "Sex (1=Male, 2=Female)": isMale ? 1 : 2,
                "Age (Months)": ageMonths,
                "sexAge": r.sexAge,
                "-3SD": r.values[0],
                "-2SD": r.values[1],
                "-1.5SD": r.values[2],
                "-1SD": r.values[3],
                "Median": r.values[4],
                "+1SD": r.values[5],
                "+1.5SD": r.values[6],
                "+2SD": r.values[7],
                "+3SD": r.values[8],
            };
        });
        const haWs = XLSX.utils.json_to_sheet(haRows);
        XLSX.utils.book_append_sheet(wb, haWs, "Height-for-Age (HA)");

        // Sheet 3: W/H
        const whRows = (growthData.whTable || []).map((r: any) => {
            return {
                "Height (cm)": r.height,
                "Male -3SD": r.maleValues[0],
                "Male -2SD": r.maleValues[1],
                "Male -1.5SD": r.maleValues[2],
                "Male Median": r.maleValues[4],
                "Male +1.5SD": r.maleValues[6],
                "Male +2SD": r.maleValues[7],
                "Male +3SD": r.maleValues[8],
                "Female -3SD": r.femaleValues[0],
                "Female -2SD": r.femaleValues[1],
                "Female -1.5SD": r.femaleValues[2],
                "Female Median": r.femaleValues[4],
                "Female +1.5SD": r.femaleValues[6],
                "Female +2SD": r.femaleValues[7],
                "Female +3SD": r.femaleValues[8],
            };
        });
        const whWs = XLSX.utils.json_to_sheet(whRows);
        XLSX.utils.book_append_sheet(wb, whWs, "Weight-for-Height (WH)");

        XLSX.writeFile(wb, `Nutrition_Assessment_Table_Template_${selectedSchoolId || "School"}.xlsx`);
    };

    // Upload custom Excel/CSV file to replace growth standards
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });

                const newGrowthData: any = { waTable: [], haTable: [], whTable: [] };

                // Parse WA sheet if present
                const waSheet = wb.Sheets["Weight-for-Age (WA)"] || wb.Sheets[wb.SheetNames[0]];
                if (waSheet) {
                    const rows: any[] = XLSX.utils.sheet_to_json(waSheet);
                    newGrowthData.waTable = rows.map(r => ({
                        sexAge: Number(r.sexAge || (Number(r["Sex (1=Male, 2=Female)"] || 1) * 1000 + Number(r["Age (Months)"] || 0))),
                        values: [
                            Number(r["-3SD"] || 0), Number(r["-2SD"] || 0), Number(r["-1.5SD"] || 0), Number(r["-1SD"] || 0),
                            Number(r["Median"] || 0),
                            Number(r["+1SD"] || 0), Number(r["+1.5SD"] || 0), Number(r["+2SD"] || 0), Number(r["+3SD"] || 0),
                        ]
                    })).filter(r => r.sexAge > 0);
                }

                // Parse HA sheet if present
                const haSheet = wb.Sheets["Height-for-Age (HA)"] || wb.Sheets[wb.SheetNames[1]];
                if (haSheet) {
                    const rows: any[] = XLSX.utils.sheet_to_json(haSheet);
                    newGrowthData.haTable = rows.map(r => ({
                        sexAge: Number(r.sexAge || (Number(r["Sex (1=Male, 2=Female)"] || 1) * 1000 + Number(r["Age (Months)"] || 0))),
                        values: [
                            Number(r["-3SD"] || 0), Number(r["-2SD"] || 0), Number(r["-1.5SD"] || 0), Number(r["-1SD"] || 0),
                            Number(r["Median"] || 0),
                            Number(r["+1SD"] || 0), Number(r["+1.5SD"] || 0), Number(r["+2SD"] || 0), Number(r["+3SD"] || 0),
                        ]
                    })).filter(r => r.sexAge > 0);
                }

                // Parse WH sheet if present
                const whSheet = wb.Sheets["Weight-for-Height (WH)"] || wb.Sheets[wb.SheetNames[2]];
                if (whSheet) {
                    const rows: any[] = XLSX.utils.sheet_to_json(whSheet);
                    newGrowthData.whTable = rows.map(r => ({
                        height: Number(r["Height (cm)"] || r.height || 0),
                        maleValues: [
                            Number(r["Male -3SD"] || 0), Number(r["Male -2SD"] || 0), Number(r["Male -1.5SD"] || 0), Number(r["Male -1SD"] || 0),
                            Number(r["Male Median"] || 0),
                            Number(r["Male +1SD"] || 0), Number(r["Male +1.5SD"] || 0), Number(r["Male +2SD"] || 0), Number(r["Male +3SD"] || 0),
                        ],
                        femaleValues: [
                            Number(r["Female -3SD"] || 0), Number(r["Female -2SD"] || 0), Number(r["Female -1.5SD"] || 0), Number(r["Female -1SD"] || 0),
                            Number(r["Female Median"] || 0),
                            Number(r["Female +1SD"] || 0), Number(r["Female +1.5SD"] || 0), Number(r["Female +2SD"] || 0), Number(r["Female +3SD"] || 0),
                        ]
                    })).filter(r => r.height > 0);
                }

                if (newGrowthData.waTable.length > 0 || newGrowthData.haTable.length > 0 || newGrowthData.whTable.length > 0) {
                    setCustomData(newGrowthData);
                    setStandardType("CUSTOM");
                    setStatusMessage({
                        type: "success",
                        text: language === "th" ? "นำเข้าไฟล์ตารางคำนวณเรียบร้อยแล้ว กด 'บันทึกการเปลี่ยนแปลง' เพื่อยืนยัน" : "File imported successfully. Click 'Save Changes' to confirm."
                    });
                } else {
                    setStatusMessage({
                        type: "error",
                        text: language === "th" ? "ไม่พบรูปแบบข้อมูลตารางในไฟล์" : "Invalid file structure."
                    });
                }
            } catch (err) {
                setStatusMessage({
                    type: "error",
                    text: language === "th" ? "เกิดข้อผิดพลาดในการอ่านไฟล์" : "Failed to parse file."
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Filter WA/HA rows by gender
    const filteredWaHaRows = (subTab === "wa" ? growthData?.waTable : growthData?.haTable) || [];
    const displayedWaHaRows = filteredWaHaRows.filter((r: any) => {
        const isMale = r.sexAge < 2000;
        return genderFilter === 1 ? isMale : !isMale;
    });

    return (
        <div className="space-y-6">
            {/* Header Controls Card */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            {language === "th" ? "ตารางคำนวณประเมินภาวะโภชนาการเฉพาะโรงเรียน" : "School Nutrition Assessment Table Manager"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            {language === "th"
                                ? "จัดการ Upload และแก้ไขตารางเกณฑ์ประเมินโภชนาการ W/A, H/A, W/H เพื่อนำไปใช้คำนวณในระบบและรายงานรายบุคคลของแต่ละโรงเรียน"
                                : "Manage, upload, and edit Nutrition Assessment Tables (W/A, H/A, W/H) applied to individual student calculations."}
                        </p>
                    </div>

                    {/* School Dropdown if multi-school context */}
                    {!initialSchoolId && schools.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedSchoolId}
                                onChange={e => setSelectedSchoolId(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {schools.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Status Message Alert */}
                {statusMessage && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${statusMessage.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                        {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <span>{statusMessage.text}</span>
                    </div>
                )}

                {/* Standard Selector & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStandardType("INMU_MAHIDOL")}
                            className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${standardType === "INMU_MAHIDOL" ? "bg-primary text-white border-primary shadow-md" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {language === "th" ? "เกณฑ์มาตรฐาน สถาบันโภชนาการ ม.มหิดล (INMU-Mahidol)" : "Default INMU-Mahidol Standard"}
                        </button>
                        <button
                            onClick={() => {
                                if (!customData) {
                                    setStatusMessage({
                                        type: "error",
                                        text: language === "th" ? "ยังไม่มีข้อมูลตารางเฉพาะโรงเรียน กรุณาอัปโหลดไฟล์" : "No custom school table data available. Please upload a file."
                                    });
                                }
                                setStandardType("CUSTOM");
                            }}
                            className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${standardType === "CUSTOM" ? "bg-primary text-white border-primary shadow-md" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                        >
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            {language === "th" ? "เกณฑ์มาตรฐานเฉพาะโรงเรียน (Custom Upload/Edit)" : "Custom School Table"}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleDownloadTemplate}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {language === "th" ? "ดาวน์โหลดไฟล์แม่แบบ (Excel)" : "Download Template"}
                        </button>

                        <label className="px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border text-foreground hover:bg-secondary/80 cursor-pointer transition-all flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            {language === "th" ? "อัปโหลดไฟล์ตารางคำนวณ" : "Upload Calculation Table"}
                            <input type="file" accept=".xlsx, .csv, .json" onChange={handleFileUpload} className="hidden" />
                        </label>

                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg, hsl(212, 100%, 52%) 0%, hsl(199, 89%, 48%) 100%)" }}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {language === "th" ? "บันทึกการเปลี่ยนแปลง" : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Reference Table View & Inspector */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* SubTabs */}
                    <div className="flex border border-border bg-background/50 p-1 rounded-lg">
                        <button
                            onClick={() => setSubTab("wa")}
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${subTab === "wa" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {t("weightForAge")} (W/A)
                        </button>
                        <button
                            onClick={() => setSubTab("ha")}
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${subTab === "ha" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {t("heightForAge")} (H/A)
                        </button>
                        <button
                            onClick={() => setSubTab("wh")}
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${subTab === "wh" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {t("weightForHeight")} (W/H)
                        </button>
                    </div>

                    {/* Gender filter for W/A & H/A */}
                    {subTab !== "wh" && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-medium">{language === "th" ? "กรองตามเพศ:" : "Filter Gender:"}</span>
                            <button
                                onClick={() => setGenderFilter(1)}
                                className={`px-3 py-1 rounded-md font-semibold transition-all ${genderFilter === 1 ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-secondary text-muted-foreground"}`}
                            >
                                {language === "th" ? "ชาย (Male)" : "Male"}
                            </button>
                            <button
                                onClick={() => setGenderFilter(2)}
                                className={`px-3 py-1 rounded-md font-semibold transition-all ${genderFilter === 2 ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-secondary text-muted-foreground"}`}
                            >
                                {language === "th" ? "หญิง (Female)" : "Female"}
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="p-12 text-center text-muted-foreground flex justify-center items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>{t("loading")}</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[500px]">
                        {subTab !== "wh" ? (
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="sticky top-0 bg-secondary border-b border-border z-10 text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="p-3 text-center">{language === "th" ? "เพศ" : "Sex"}</th>
                                        <th className="p-3 text-center">{language === "th" ? "อายุ (เดือน)" : "Age (mo)"}</th>
                                        <th className="p-3 text-center bg-blue-500/10 text-blue-400">-3SD (น้อยมาก)</th>
                                        <th className="p-3 text-center bg-yellow-500/10 text-yellow-400">-2SD</th>
                                        <th className="p-3 text-center">-1.5SD</th>
                                        <th className="p-3 text-center bg-green-500/10 text-green-400">Median (มัธยฐาน)</th>
                                        <th className="p-3 text-center">+1.5SD</th>
                                        <th className="p-3 text-center bg-yellow-500/10 text-yellow-400">+2SD</th>
                                        <th className="p-3 text-center bg-red-500/10 text-red-400">+3SD (มากมาก)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50 font-mono">
                                    {displayedWaHaRows.slice(0, 100).map((row: any, idx: number) => {
                                        const isMale = row.sexAge < 2000;
                                        const ageMonths = row.sexAge % 1000;
                                        return (
                                            <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                                                <td className="p-2.5 text-center font-sans font-medium">{isMale ? (language === "th" ? "ชาย" : "Male") : (language === "th" ? "หญิง" : "Female")}</td>
                                                <td className="p-2.5 text-center font-sans font-bold">{ageMonths} {language === "th" ? "ด." : "mo"}</td>
                                                <td className="p-2.5 text-center">{row.values[0]}</td>
                                                <td className="p-2.5 text-center">{row.values[1]}</td>
                                                <td className="p-2.5 text-center">{row.values[2]}</td>
                                                <td className="p-2.5 text-center font-bold text-emerald-400">{row.values[4]}</td>
                                                <td className="p-2.5 text-center">{row.values[6]}</td>
                                                <td className="p-2.5 text-center">{row.values[7]}</td>
                                                <td className="p-2.5 text-center">{row.values[8]}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="sticky top-0 bg-secondary border-b border-border z-10 text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="p-3 text-center">{language === "th" ? "ส่วนสูง (ซม.)" : "Height (cm)"}</th>
                                        <th className="p-3 text-center bg-blue-500/10 text-blue-400">ชาย Median</th>
                                        <th className="p-3 text-center">ชาย -2SD / +2SD</th>
                                        <th className="p-3 text-center bg-pink-500/10 text-pink-400">หญิง Median</th>
                                        <th className="p-3 text-center">หญิง -2SD / +2SD</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50 font-mono">
                                    {(growthData?.whTable || []).slice(0, 100).map((row: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                                            <td className="p-2.5 text-center font-sans font-bold">{row.height} cm</td>
                                            <td className="p-2.5 text-center font-bold text-blue-400">{row.maleValues?.[4] ?? "—"}</td>
                                            <td className="p-2.5 text-center">{row.maleValues?.[1]} / {row.maleValues?.[7]}</td>
                                            <td className="p-2.5 text-center font-bold text-pink-400">{row.femaleValues?.[4] ?? "—"}</td>
                                            <td className="p-2.5 text-center">{row.femaleValues?.[1]} / {row.femaleValues?.[7]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
