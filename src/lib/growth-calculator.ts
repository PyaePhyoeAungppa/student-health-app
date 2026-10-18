import defaultGrowthStandards from "@/lib/growth-standards.json";

export interface GrowthStandards {
    waTable: { sexAge: number; values: number[] }[];
    haTable: { sexAge: number; values: number[] }[];
    whTable: { height: number; maleValues: number[]; femaleValues: number[] }[];
}

export function getSchoolGrowthStandards(school: any): GrowthStandards {
    if (school?.nutritionStandardType === "CUSTOM" && school?.customGrowthStandards) {
        return school.customGrowthStandards;
    }
    return defaultGrowthStandards as GrowthStandards;
}

export function calculateZScoreAndClass(
    val: number,
    refValues: number[],
    isHeight: boolean,
    isWeightForHeight: boolean
) {
    const [sd3n, sd2n, sd1_5n, sd1n, median, sd1p, sd1_5p, sd2p, sd3p] = refValues;

    let code = 4;
    let label = "";

    if (isHeight) {
        if (val < sd2n) {
            code = 1;
            label = "เตี้ย";
        } else if (val < sd1_5n) {
            code = 2;
            label = "ค่อนข้างเตี้ย";
        } else if (val <= sd1_5p) {
            code = 3;
            label = "ส่วนสูงตามเกณฑ์";
        } else if (val <= sd2p) {
            code = 4;
            label = "ค่อนข้างสูง";
        } else {
            code = 5;
            label = "สูงกว่าเกณฑ์";
        }
    } else if (isWeightForHeight) {
        if (val < sd2n) {
            code = 1;
            label = "ผอม";
        } else if (val < sd1_5n) {
            code = 2;
            label = "ค่อนข้างผอม";
        } else if (val <= sd1_5p) {
            code = 3;
            label = "สมส่วน";
        } else if (val <= sd2p) {
            code = 4;
            label = "ท้วม";
        } else if (val <= sd3p) {
            code = 5;
            label = "เริ่มอ้วน";
        } else {
            code = 6;
            label = "อ้วน";
        }
    } else {
        // Weight-for-Age
        if (val < sd2n) {
            code = 1;
            label = "น้ำหนักน้อยกว่าเกณฑ์";
        } else if (val < sd1_5n) {
            code = 2;
            label = "น้ำหนักค่อนข้างน้อย";
        } else if (val <= sd1_5p) {
            code = 3;
            label = "น้ำหนักตามเกณฑ์";
        } else if (val <= sd2p) {
            code = 4;
            label = "น้ำหนักค่อนข้างมาก";
        } else {
            code = 5;
            label = "น้ำหนักมากกว่าเกณฑ์";
        }
    }

    let zScore = 0;
    if (val === median) {
        zScore = 0;
    } else if (val > median) {
        if (val <= sd1p) {
            zScore = (val - median) / (sd1p - median);
        } else if (val <= sd1_5p) {
            zScore = 1 + 0.5 * (val - sd1p) / (sd1_5p - sd1p);
        } else if (val <= sd2p) {
            zScore = 1.5 + 0.5 * (val - sd1_5p) / (sd2p - sd1_5p);
        } else if (val <= sd3p) {
            zScore = 2 + (val - sd2p) / (sd3p - sd2p);
        } else {
            zScore = 3 + (val - sd3p) / (sd3p - sd2p);
        }
    } else {
        if (val >= sd1n) {
            zScore = -((median - val) / (median - sd1n));
        } else if (val >= sd1_5n) {
            zScore = -1 - 0.5 * (sd1n - val) / (sd1n - sd1_5n);
        } else if (val >= sd2n) {
            zScore = -1.5 - 0.5 * (sd1_5n - val) / (sd1_5n - sd2n);
        } else if (val >= sd3n) {
            zScore = -2 - (sd2n - val) / (sd2n - sd3n);
        } else {
            zScore = -3 - (sd3n - val) / (sd2n - sd3n);
        }
    }

    return {
        zScore: parseFloat(zScore.toFixed(2)),
        code,
        label
    };
}

export function evaluateStudentGrowth(student: any, latestRecord: any, standards: GrowthStandards) {
    if (!latestRecord || latestRecord.weight == null || latestRecord.height == null || latestRecord.weight === 0 || latestRecord.height === 0) {
        return {
            waZScore: "—", waLabel: "—",
            haZScore: "—", haLabel: "—",
            whZScore: "—", whLabel: "—",
        };
    }

    const w = Number(latestRecord.weight);
    const h = Number(latestRecord.height);

    let ageInYears = student.age;
    let ageInMonths = 0;
    if (ageInYears !== undefined && ageInYears !== null) {
        ageInMonths = ageInYears * 12;
    } else if (student.dob) {
        const dobDate = new Date(student.dob);
        const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
        ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
        if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
        if (ageInMonths < 0) ageInMonths = 0;
        ageInYears = Math.floor(ageInMonths / 12);
    } else {
        ageInYears = 0;
        ageInMonths = 0;
    }

    const isMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'MALE' || student.gender === 'ชาย' || student.prefix === 'ด.ช.' || student.prefix === 'เด็กชาย' || student.prefix === 'นาย';
    const gender = isMale ? 1 : 2;

    const sexAge = gender * 1000 + Math.min(239, ageInMonths);

    let waRes = null;
    let haRes = null;
    let whRes = null;

    if (standards.waTable) {
        const waRef = standards.waTable.find(r => r.sexAge === sexAge);
        if (waRef) waRes = calculateZScoreAndClass(w, waRef.values, false, false);
    }

    if (standards.haTable) {
        const haRef = standards.haTable.find(r => r.sexAge === sexAge);
        if (haRef) haRes = calculateZScoreAndClass(h, haRef.values, true, false);
    }

    if (standards.whTable) {
        const roundedHeight = Math.round(h * 4) / 4;
        const whRef = standards.whTable.find(r => r.height === roundedHeight);
        const whValues = whRef ? (gender === 1 ? whRef.maleValues : whRef.femaleValues) : null;
        if (whValues && !whValues.includes(NaN)) whRes = calculateZScoreAndClass(w, whValues, false, true);
    }

    return {
        waZScore: waRes ? waRes.zScore : "—",
        waLabel: waRes ? waRes.label : "—",
        haZScore: haRes ? haRes.zScore : "—",
        haLabel: haRes ? haRes.label : "—",
        whZScore: whRes ? whRes.zScore : "—",
        whLabel: whRes ? whRes.label : "—",
    };
}
