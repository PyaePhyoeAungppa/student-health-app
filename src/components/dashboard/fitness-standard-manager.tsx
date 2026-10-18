"use client";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { Activity, Search, ShieldCheck, CheckCircle2, ChevronRight, Info } from "lucide-react";
import defaultFitnessStandards from "@/lib/fitness-standards.json";

interface FitnessStandardManagerProps {
    initialSchoolId?: string;
}

export function FitnessStandardManager({ initialSchoolId }: FitnessStandardManagerProps) {
    const { t, language } = useLanguage();
    const [selectedTest, setSelectedTest] = useState<"sitAndReach" | "standingKneeRaises" | "chairStand" | "handgrip" | "situps" | "pushups">("sitAndReach");
    const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
    const [ageSearch, setAgeSearch] = useState("");

    const currentData = (selectedTest === "handgrip"
        ? (defaultFitnessStandards as any).handgripStrength
        : selectedTest === "situps"
        ? (defaultFitnessStandards as any).situps
        : selectedTest === "pushups"
        ? (defaultFitnessStandards as any).pushups
        : selectedTest === "chairStand"
        ? (defaultFitnessStandards as any).chairStand
        : selectedTest === "standingKneeRaises"
        ? (defaultFitnessStandards as any).standingKneeRaises
        : defaultFitnessStandards.sitAndReach) || [];

    const isCurrentActive = true;

    const filteredRows = currentData.filter((row: any) => {
        if (!ageSearch) return true;
        const search = ageSearch.trim();
        if (row.ageMin === row.ageMax) {
            return String(row.ageMin).includes(search);
        }
        return `${row.ageMin}-${row.ageMax}`.includes(search);
    });

    const testInfo = selectedTest === "handgrip" ? {
        titleTh: "เกณฑ์มาตรฐานรายการแรงบีบมือ (กิโลกรัมต่อน้ำหนักตัว)",
        titleEn: "Handgrip Strength Test Standard Norms (kg/kg body weight)",
        unitTh: "หน่วย: กิโลกรัม (kg) สำหรับอายุ 11 - 19 ปี",
        unitEn: "Measurement Unit: Kilograms (kg) for Ages 11 - 19",
    } : selectedTest === "situps" ? {
        titleTh: "เกณฑ์มาตรฐานรายการลุก-นั่ง 60 วินาที (ครั้ง)",
        titleEn: "60-Second Sit-Up Test Standard Norms (Reps)",
        unitTh: "หน่วย: ครั้ง (Reps) สำหรับอายุ 7 - 59 ปี",
        unitEn: "Measurement Unit: Repetitions (Reps) for Ages 7 - 59",
    } : selectedTest === "pushups" ? {
        titleTh: "เกณฑ์มาตรฐานรายการดันพื้นประยุกต์ 30 วินาที (ครั้ง)",
        titleEn: "30-Second Modified Push-Up Test Standard Norms (Reps)",
        unitTh: "หน่วย: ครั้ง (Reps) สำหรับอายุ 7 - 18 ปี",
        unitEn: "Measurement Unit: Repetitions (Reps) for Ages 7 - 18",
    } : selectedTest === "chairStand" ? {
        titleTh: "เกณฑ์มาตรฐานรายการยืน-นั่งบนเก้าอี้ 60 วินาที (ครั้ง)",
        titleEn: "60-Second Chair Stand Test Standard Norms (Reps)",
        unitTh: "หน่วย: ครั้ง (Reps) สำหรับอายุ 19 - 59 ปี",
        unitEn: "Measurement Unit: Repetitions (Reps) for Ages 19 - 59",
    } : selectedTest === "standingKneeRaises" ? {
        titleTh: "เกณฑ์มาตรฐานรายการยกเข่า ขึ้น-ลง 3 นาที (ครั้ง)",
        titleEn: "3-Minute High-Knee Lift Test Standard Norms (Reps)",
        unitTh: "หน่วย: ครั้ง (Reps)",
        unitEn: "Measurement Unit: Repetitions (Reps)",
    } : {
        titleTh: "เกณฑ์มาตรฐานรายการนั่งงอตัวไปด้านหน้า (เซนติเมตร)",
        titleEn: "Sit and Reach Test Standard Norms (in centimeters)",
        unitTh: "หน่วย: เซนติเมตร (cm)",
        unitEn: "Measurement Unit: Centimeters (cm)",
    };

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="glass-card p-6 border-l-4 border-l-primary">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <span>
                                {language === "th"
                                    ? "เกณฑ์มาตรฐานสมรรถภาพทางกาย (Physical Fitness Standards)"
                                    : "Physical Fitness Standard Norms"}
                            </span>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            {language === "th"
                                ? "เกณฑ์การจำแนกระดับสมรรถภาพ (ดีมาก, ดี, ปานกลาง, ต่ำ, ต่ำมาก) สำหรับนักเรียนตามเพศและช่วงอายุ"
                                : "Standard performance norm classifications (Very Good, Good, Average, Below Average, Poor) by age and gender."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {language === "th" ? "เกณฑ์มาตรฐานกรมพลศึกษา / DPE Active" : "Active Standard"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Test Selection Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
                {[
                    { key: "sitAndReach", labelTh: "ความอ่อนตัว (Sit & Reach)", labelEn: "Sit & Reach Test", active: true },
                    { key: "standingKneeRaises", labelTh: "ยกเข่าขึ้น-ลง 3 นาที (High-Knee Lift)", labelEn: "3-Min High-Knee Lift", active: true },
                    { key: "chairStand", labelTh: "ยืน-นั่งบนเก้าอี้ 60 วิ (Chair Stand)", labelEn: "Chair Stand 60s", active: true },
                    { key: "handgrip", labelTh: "แรงบีบมือ (Handgrip)", labelEn: "Handgrip Test", active: true },
                    { key: "situps", labelTh: "ลุก-นั่ง 60 วิ (Sit-ups)", labelEn: "60s Sit-ups Test", active: true },
                    { key: "pushups", labelTh: "ดันพื้นประยุกต์ 30 วิ (Push-ups)", labelEn: "30s Modified Push-ups", active: true },
                ].map(item => (
                    <button
                        key={item.key}
                        onClick={() => setSelectedTest(item.key as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                            selectedTest === item.key
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-secondary/40 text-muted-foreground hover:bg-secondary/80"
                        }`}
                    >
                        <span>{language === "th" ? item.labelTh : item.labelEn}</span>
                        {!item.active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 border border-border/50 text-muted-foreground">
                                {language === "th" ? "รอข้อมูลแผ่นถัดไป" : "Next sheet"}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {isCurrentActive ? (
                <div className="glass-card p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-sm">
                                {language === "th" ? testInfo.titleTh : testInfo.titleEn}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {language === "th" ? testInfo.unitTh : testInfo.unitEn}
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-44">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={language === "th" ? "ค้นหาอายุ (ปี)..." : "Filter age..."}
                                    value={ageSearch}
                                    onChange={e => setAgeSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex rounded-lg border border-border overflow-hidden bg-secondary/30 p-0.5 text-xs">
                                {[
                                    { key: "all", label: language === "th" ? "ทั้งหมด" : "All" },
                                    { key: "male", label: language === "th" ? "ชาย" : "Male" },
                                    { key: "female", label: language === "th" ? "หญิง" : "Female" },
                                ].map(g => (
                                    <button
                                        key={g.key}
                                        onClick={() => setGenderFilter(g.key as any)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            genderFilter === g.key
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Norms Table */}
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/70 border-b border-border text-muted-foreground">
                                    <th rowSpan={2} className="p-2.5 font-semibold text-foreground border-r border-border min-w-[90px]">
                                        {language === "th" ? "อายุ (ปี)" : "Age (years)"}
                                    </th>
                                    {(genderFilter === "all" || genderFilter === "male") && (
                                        <th colSpan={5} className="p-2 text-center font-semibold text-blue-400 border-r border-border bg-blue-500/5">
                                            {language === "th" ? "เพศชาย (Male)" : "Male"}
                                        </th>
                                    )}
                                    {(genderFilter === "all" || genderFilter === "female") && (
                                        <th colSpan={5} className="p-2 text-center font-semibold text-pink-400 bg-pink-500/5">
                                            {language === "th" ? "เพศหญิง (Female)" : "Female"}
                                        </th>
                                    )}
                                </tr>
                                <tr className="bg-secondary/40 border-b border-border text-[11px]">
                                    {(genderFilter === "all" || genderFilter === "male") && (
                                        <>
                                            <th className="p-2 text-center text-rose-400 font-medium">{language === "th" ? "ต่ำมาก" : "Very Low"}</th>
                                            <th className="p-2 text-center text-amber-400 font-medium">{language === "th" ? "ต่ำ" : "Low"}</th>
                                            <th className="p-2 text-center text-sky-400 font-medium">{language === "th" ? "ปานกลาง" : "Average"}</th>
                                            <th className="p-2 text-center text-green-400 font-medium">{language === "th" ? "ดี" : "Good"}</th>
                                            <th className="p-2 text-center text-emerald-400 font-medium border-r border-border">{language === "th" ? "ดีมาก" : "Very Good"}</th>
                                        </>
                                    )}
                                    {(genderFilter === "all" || genderFilter === "female") && (
                                        <>
                                            <th className="p-2 text-center text-rose-400 font-medium">{language === "th" ? "ต่ำมาก" : "Very Low"}</th>
                                            <th className="p-2 text-center text-amber-400 font-medium">{language === "th" ? "ต่ำ" : "Low"}</th>
                                            <th className="p-2 text-center text-sky-400 font-medium">{language === "th" ? "ปานกลาง" : "Average"}</th>
                                            <th className="p-2 text-center text-green-400 font-medium">{language === "th" ? "ดี" : "Good"}</th>
                                            <th className="p-2 text-center text-emerald-400 font-medium">{language === "th" ? "ดีมาก" : "Very Good"}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row: any, idx: number) => {
                                    const ageLabel = row.ageMin === row.ageMax ? `${row.ageMin}` : `${row.ageMin} - ${row.ageMax}`;
                                    const m = row.male;
                                    const f = row.female;

                                    return (
                                        <tr key={idx} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                            <td className="p-2.5 font-bold text-foreground border-r border-border bg-secondary/10">
                                                {ageLabel} {language === "th" ? "ปี" : "yrs"}
                                            </td>
                                            {(genderFilter === "all" || genderFilter === "male") && (
                                                <>
                                                    <td className="p-2 text-center text-muted-foreground">{`≤ ${m[0]}`}</td>
                                                    <td className="p-2 text-center text-muted-foreground">{`${m[0] + 1} - ${m[1]}`}</td>
                                                    <td className="p-2 text-center text-foreground font-medium">{`${m[1] + 1} - ${m[2]}`}</td>
                                                    <td className="p-2 text-center text-muted-foreground">{`${m[2] + 1} - ${m[3]}`}</td>
                                                    <td className="p-2 text-center text-emerald-400 font-medium border-r border-border">{`≥ ${m[3] + 1}`}</td>
                                                </>
                                            )}
                                            {(genderFilter === "all" || genderFilter === "female") && (
                                                <>
                                                    <td className="p-2 text-center text-muted-foreground">{`≤ ${f[0]}`}</td>
                                                    <td className="p-2 text-center text-muted-foreground">{`${f[0] + 1} - ${f[1]}`}</td>
                                                    <td className="p-2 text-center text-foreground font-medium">{`${f[1] + 1} - ${f[2]}`}</td>
                                                    <td className="p-2 text-center text-muted-foreground">{`${f[2] + 1} - ${f[3]}`}</td>
                                                    <td className="p-2 text-center text-emerald-400 font-medium">{`≥ ${f[3] + 1}`}</td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-12 text-center space-y-3">
                    <Info className="w-10 h-10 mx-auto text-primary/40 animate-pulse" />
                    <h3 className="font-bold text-sm">
                        {language === "th" ? "รอการนำเข้าข้อมูลเกณฑ์มาตรฐานแผ่นถัดไป" : "Awaiting Sheet Data for this Test"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        {language === "th"
                            ? "เมื่อได้รับข้อมูลเกณฑ์มาตรฐานสำหรับรายการนี้ ระบบจะอัปเดตเกณฑ์ประเมินและแสดงผลลัพธ์ระดับสมรรถภาพโดยอัตโนมัติ"
                            : "Once you paste the reference table for this test sheet, the classification norms will be automatically populated here."}
                    </p>
                </div>
            )}
        </div>
    );
}
