import defaultFitnessStandards from "@/lib/fitness-standards.json";

export type FitnessLevel = "VERY_LOW" | "LOW" | "AVERAGE" | "GOOD" | "VERY_GOOD" | "UNKNOWN";

export interface FitnessResult {
    testKey: string;
    testNameTh: string;
    testNameEn: string;
    level: FitnessLevel;
    labelTh: string;
    labelEn: string;
    colorClass: string;
    value?: number | null;
    unit?: string;
}

export interface FitnessNormEntry {
    ageMin: number;
    ageMax: number;
    male: number[]; // [veryLowMax, lowMax, averageMax, goodMax]
    female: number[];
}

export interface FitnessStandards {
    sitAndReach?: FitnessNormEntry[];
    handgripStrength?: FitnessNormEntry[];
    standingKneeRaises?: FitnessNormEntry[];
    chairStand?: FitnessNormEntry[];
    situps?: FitnessNormEntry[];
    pushups?: FitnessNormEntry[];
}

export function getLevelDetails(level: FitnessLevel): { labelTh: string; labelEn: string; colorClass: string } {
    switch (level) {
        case "VERY_GOOD":
            return {
                labelTh: "ดีมาก",
                labelEn: "Very Good",
                colorClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
            };
        case "GOOD":
            return {
                labelTh: "ดี",
                labelEn: "Good",
                colorClass: "bg-green-500/15 text-green-400 border border-green-500/30",
            };
        case "AVERAGE":
            return {
                labelTh: "ปานกลาง",
                labelEn: "Average",
                colorClass: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
            };
        case "LOW":
            return {
                labelTh: "ต่ำ",
                labelEn: "Below Average",
                colorClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
            };
        case "VERY_LOW":
            return {
                labelTh: "ต่ำมาก",
                labelEn: "Poor",
                colorClass: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
            };
        default:
            return {
                labelTh: "—",
                labelEn: "—",
                colorClass: "bg-muted/30 text-muted-foreground border border-border",
            };
    }
}

export function evaluateThresholdNorm(val: number, cutoffs: number[]): FitnessLevel {
    if (!cutoffs || cutoffs.length < 4) return "UNKNOWN";
    const [veryLowMax, lowMax, averageMax, goodMax] = cutoffs;
    if (val <= veryLowMax) return "VERY_LOW";
    if (val <= lowMax) return "LOW";
    if (val <= averageMax) return "AVERAGE";
    if (val <= goodMax) return "GOOD";
    return "VERY_GOOD";
}

export function getStudentAgeYears(student: any, latestRecord?: any): number {
    if (student?.age !== undefined && student?.age !== null) {
        return Number(student.age);
    }
    if (student?.dob) {
        const dobDate = new Date(student.dob);
        const checkupDate = latestRecord?.recordedAt ? new Date(latestRecord.recordedAt) : new Date();
        let years = checkupDate.getFullYear() - dobDate.getFullYear();
        const m = checkupDate.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && checkupDate.getDate() < dobDate.getDate())) {
            years--;
        }
        return Math.max(0, years);
    }
    return 10; // Default fallback age
}

export function isMaleStudent(student: any): boolean {
    const g = String(student?.gender || "").toLowerCase();
    const p = String(student?.prefix || "").toLowerCase();
    if (g === "male" || g === "ชาย" || g === "m") return true;
    if (g === "female" || g === "หญิง" || g === "f") return false;
    if (p.includes("ด.ช.") || p.includes("เด็กชาย") || p.includes("นาย")) return true;
    return false;
}

export function evaluateStudentFitness(
    student: any,
    latestRecord: any,
    customStandards?: FitnessStandards
): Record<string, FitnessResult> {
    const results: Record<string, FitnessResult> = {};
    if (!latestRecord) return results;

    const standards: FitnessStandards = customStandards || (defaultFitnessStandards as FitnessStandards);
    const age = getStudentAgeYears(student, latestRecord);
    const isMale = isMaleStudent(student);

    // 1. Flexibility / Sit and Reach Test (นั่งงอตัวไปด้านหน้า)
    if (latestRecord.flexibility !== undefined && latestRecord.flexibility !== null && latestRecord.flexibility !== "") {
        const flexVal = parseFloat(String(latestRecord.flexibility));
        if (!isNaN(flexVal)) {
            let level: FitnessLevel = "UNKNOWN";
            if (standards.sitAndReach && standards.sitAndReach.length > 0) {
                // Find norm row matching student's age (clamp min 7, max 59)
                const clampedAge = Math.max(7, Math.min(59, age));
                const entry = standards.sitAndReach.find(e => clampedAge >= e.ageMin && clampedAge <= e.ageMax)
                    || standards.sitAndReach[0];
                if (entry) {
                    const cutoffs = isMale ? entry.male : entry.female;
                    level = evaluateThresholdNorm(flexVal, cutoffs);
                }
            }
            const details = getLevelDetails(level);
            results.flexibility = {
                testKey: "flexibility",
                testNameTh: "ความอ่อนตัว : นั่งงอตัวไปด้านหน้า (Sit and Reach Test)",
                testNameEn: "Flexibility (Sit and Reach Test)",
                level,
                ...details,
                value: flexVal,
                unit: "cm",
            };
        }
    }

    // 2. Handgrip Strength (แรงบีบมือ)
    if (latestRecord.handgripStrength !== undefined && latestRecord.handgripStrength !== null && latestRecord.handgripStrength !== "") {
        const gripVal = parseFloat(String(latestRecord.handgripStrength));
        if (!isNaN(gripVal)) {
            let level: FitnessLevel = "UNKNOWN";
            if (standards.handgripStrength && standards.handgripStrength.length > 0) {
                const clampedAge = Math.max(11, Math.min(19, age));
                const entry = standards.handgripStrength.find(e => clampedAge >= e.ageMin && clampedAge <= e.ageMax);
                if (entry) {
                    const cutoffs = isMale ? entry.male : entry.female;
                    level = evaluateThresholdNorm(gripVal, cutoffs);
                }
            }
            const details = getLevelDetails(level);
            results.handgripStrength = {
                testKey: "handgripStrength",
                testNameTh: "แรงบีบมือ (Handgrip Strength Test)",
                testNameEn: "Handgrip Strength Test",
                level,
                ...details,
                value: gripVal,
                unit: "kg",
            };
        }
    }

    // 3. Standing Knee Raises / 3 Minutes Step Up and Down (ยืนยกเข่า 3 นาที)
    if (latestRecord.standingKneeRaises !== undefined && latestRecord.standingKneeRaises !== null && latestRecord.standingKneeRaises !== "") {
        const kneeVal = parseFloat(String(latestRecord.standingKneeRaises));
        if (!isNaN(kneeVal)) {
            let level: FitnessLevel = "UNKNOWN";
            if (standards.standingKneeRaises && standards.standingKneeRaises.length > 0) {
                const clampedAge = Math.max(7, Math.min(59, age));
                const entry = standards.standingKneeRaises.find(e => clampedAge >= e.ageMin && clampedAge <= e.ageMax);
                if (entry) {
                    const cutoffs = isMale ? entry.male : entry.female;
                    level = evaluateThresholdNorm(kneeVal, cutoffs);
                }
            }
            const details = getLevelDetails(level);
            results.standingKneeRaises = {
                testKey: "standingKneeRaises",
                testNameTh: "การยกเข่า ขึ้น-ลง 3 นาที (3-Minute High-Knee Lift Test)",
                testNameEn: "3-Minute High-Knee Lift Test",
                level,
                ...details,
                value: kneeVal,
                unit: "reps",
            };
        }
    }

    // 4. Chair Stand Test / 60-Second Chair Stand Test (การยืน-นั่งบนเก้าอี้ 60 วินาที)
    if (latestRecord.chairStand !== undefined && latestRecord.chairStand !== null && latestRecord.chairStand !== "") {
        const chairVal = parseFloat(String(latestRecord.chairStand));
        if (!isNaN(chairVal)) {
            let level: FitnessLevel = "UNKNOWN";
            if (standards.chairStand && standards.chairStand.length > 0) {
                const clampedAge = Math.max(19, Math.min(59, age));
                const entry = standards.chairStand.find(e => clampedAge >= e.ageMin && clampedAge <= e.ageMax);
                if (entry) {
                    const cutoffs = isMale ? entry.male : entry.female;
                    level = evaluateThresholdNorm(chairVal, cutoffs);
                }
            }
            const details = getLevelDetails(level);
            results.chairStand = {
                testKey: "chairStand",
                testNameTh: "การยืน-นั่งบนเก้าอี้ 60 วินาที (60-Second Chair Stand Test)",
                testNameEn: "60-Second Chair Stand Test",
                level,
                ...details,
                value: chairVal,
                unit: "reps",
            };
        }
    }

    // 5. Sit-ups / 60-Second Sit-Up Test (การลุก-นั่ง 60 วินาที)
    if (latestRecord.situps !== undefined && latestRecord.situps !== null && latestRecord.situps !== "") {
        const sitVal = parseFloat(String(latestRecord.situps));
        if (!isNaN(sitVal)) {
            let level: FitnessLevel = "UNKNOWN";
            if (standards.situps && standards.situps.length > 0) {
                const clampedAge = Math.max(7, Math.min(59, age));
                const entry = standards.situps.find(e => clampedAge >= e.ageMin && clampedAge <= e.ageMax);
                if (entry) {
                    const cutoffs = isMale ? entry.male : entry.female;
                    level = evaluateThresholdNorm(sitVal, cutoffs);
                }
            }
            const details = getLevelDetails(level);
            results.situps = {
                testKey: "situps",
                testNameTh: "การลุก-นั่ง 60 วินาที (60-Second Sit-Up Test)",
                testNameEn: "60-Second Sit-Up Test",
                level,
                ...details,
                value: sitVal,
                unit: "reps",
            };
        }
    }

    // 5. Push-ups / 30 Seconds Modified Push-ups (ดันพื้นประยุกต์ 30 วินาที)
    if (latestRecord.pushups !== undefined && latestRecord.pushups !== null && latestRecord.pushups !== "") {
        const pushVal = parseFloat(String(latestRecord.pushups));
        if (!isNaN(pushVal)) {
            let level: FitnessLevel = "UNKNOWN";
            if (standards.pushups && standards.pushups.length > 0) {
                const clampedAge = Math.max(7, Math.min(18, age));
                const entry = standards.pushups.find(e => clampedAge >= e.ageMin && clampedAge <= e.ageMax);
                if (entry) {
                    const cutoffs = isMale ? entry.male : entry.female;
                    level = evaluateThresholdNorm(pushVal, cutoffs);
                }
            }
            const details = getLevelDetails(level);
            results.pushups = {
                testKey: "pushups",
                testNameTh: "การดันพื้นประยุกต์ 30 วินาที (30-Second Modified Push-Up Test)",
                testNameEn: "30-Second Modified Push-Up Test",
                level,
                ...details,
                value: pushVal,
                unit: "reps",
            };
        }
    }

    return results;
}
