import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const url = new URL(req.url);
        const schoolId = url.searchParams.get("schoolId");

        let testsConfig: any = null;
        if (schoolId) {
            const dbData = await readDb();
            const school = dbData.schools?.find((s: any) => s.id === schoolId);
            if (school && school.testsConfig) {
                testsConfig = school.testsConfig;
            }
        } else if ((session.user as any)?.role === "SCHOOL_STAFF" && (session.user as any)?.schoolId) {

             const dbData = await readDb();
             const school = dbData.schools?.find((s: any) => s.id === (session.user as any).schoolId);
             if (school && school.testsConfig) {
                 testsConfig = school.testsConfig;
             }
        }

        const optionalKeys = ["gender", "handgripStrength", "standingKneeRaises", "situps", "pushups"];
        const isTestEnabled = (key: string) => {
            if (!optionalKeys.includes(key)) return true;
            return testsConfig ? testsConfig[key] !== false : true;
        };

        // Build headers dynamically
        const headers = [
            "เลขประจำตัว", "คำนำ", "ชื่อ", "นามสกุล"
        ];
        if (isTestEnabled("gender")) headers.push("เพศ");
        
        headers.push("ชั้น", "ห้อง", "เลขที่", "อายุ", "ปีการศึกษา", "น้ำหนัก", "ส่วนสูง");
        
        if (isTestEnabled("bloodType")) headers.push("กรุ๊ปเลือด");
        headers.push("โรคประจำตัว", "แพ้ยา");
        if (isTestEnabled("hearingTest")) headers.push("การได้ยิน");
        if (isTestEnabled("colorBlindness")) headers.push("การแยกสี");
        if (isTestEnabled("visualAcuity")) headers.push("ระยะการมอง");
        if (isTestEnabled("eyeExamReport")) headers.push("สรุปผลสายตา");
        if (isTestEnabled("xRayResult")) headers.push("ผลเอ็กซเรย์");
        if (isTestEnabled("flexibility")) headers.push("ความอ่อนตัว : Sit and Reach Test");
        if (isTestEnabled("handgripStrength")) headers.push("แรงบีบมือ : Hand Grip Strength");
        if (isTestEnabled("standingKneeRaises")) headers.push("ยืนยกเข่า 3 นาที : 3 Minutes Step Up and Down");
        if (isTestEnabled("situps")) headers.push("ลุก-นั่ง 60 วินาที : 60 Seconds Sit-ups");
        if (isTestEnabled("pushups")) headers.push("ดันพื้นประยุกต์ 30 วินาที : 30 Seconds Modified Push-ups");
        if (isTestEnabled("symptoms")) headers.push("อาการเบื้องต้น");
        headers.push("บันทึกเพิ่มเติม");

        // Helper to build a row based on config
        const buildRow = (base: any[], gender: string, extras1: any[], options: any, extras2: any[]) => {
            const row = [...base];
            if (isTestEnabled("gender")) row.push(gender);
            row.push(...extras1);
            if (isTestEnabled("bloodType")) row.push(options.bloodType);
            row.push(options.disease, options.allergy);
            if (isTestEnabled("hearingTest")) row.push(options.hearing);
            if (isTestEnabled("colorBlindness")) row.push(options.color);
            if (isTestEnabled("visualAcuity")) row.push(options.visualAcuity);
            if (isTestEnabled("eyeExamReport")) row.push(options.eyeExamReport);
            if (isTestEnabled("xRayResult")) row.push(options.xray);
            if (isTestEnabled("flexibility")) row.push(options.flex);
            if (isTestEnabled("handgripStrength")) row.push(options.grip);
            if (isTestEnabled("standingKneeRaises")) row.push(options.knee);
            if (isTestEnabled("situps")) row.push(options.situp);
            if (isTestEnabled("pushups")) row.push(options.pushup);
            if (isTestEnabled("symptoms")) row.push(options.symptoms);
            row.push(...extras2);
            return row;
        };

        const rows = [
            buildRow(
                ["STU001", "ด.ญ.", "สมหญิง", "ใจดี"], "หญิง", ["ม.1", "1", "1", "13", "2026", "45.5", "155"],
                { bloodType: "AB", disease: "-", allergy: "-", hearing: "ปกติ Normal", color: "ปกติ normal", visualAcuity: "20/20", eyeExamReport: "ปกติ - normal", xray: "normal", flex: "12", grip: "18", knee: "20", situp: "30", pushup: "15", symptoms: "ปกติ normal" },
                ["สุขภาพแข็งแรงดี"]
            ),
            buildRow(
                ["STU002", "ด.ช.", "สมชาย", "เรียนดี"], "ชาย", ["ม.1", "1", "2", "12", "2026", "666", "160"],
                { bloodType: "O", disease: "Asthma (หอบหืด)", allergy: "-", hearing: "ปกติ Normal", color: "ปกติ normal", visualAcuity: "20/30", eyeExamReport: "ควรเริ่มดูแลสายตา - Eye care recommended", xray: "normal", flex: "10", grip: "20", knee: "15", situp: "25", pushup: "10", symptoms: "ผิดปกติ Abnormal จามบ่อย" },
                ["-"]
            ),
            buildRow(
                ["STU003", "ด.ญ.", "รักดี", "มีสุข"], "หญิง", ["ม.2", "1", "1", "14", "2026", "52", "165"],
                { bloodType: "A", disease: "-", allergy: "Penicillin", hearing: "ปกติ Normal", color: "ปกติ normal", visualAcuity: "20/20", eyeExamReport: "ปกติ - normal", xray: "normal", flex: "15", grip: "22", knee: "25", situp: "40", pushup: "20", symptoms: "ปกติ normal" },
                ["-"]
            ),
            buildRow(
                ["STU004", "ด.ช.", "เก่งกาจ", "หาญกล้า"], "ชาย", ["ม.3", "2", "5", "14", "2026", "65", "172"],
                { bloodType: "B", disease: "-", allergy: "-", hearing: "ปกติ Normal", color: "ผิดปกติ abnormal", visualAcuity: "20/200", eyeExamReport: "ผิดปกติ - abnormal", xray: "normal", flex: "8", grip: "25", knee: "30", situp: "45", pushup: "25", symptoms: "ปกติ normal" },
                ["-"]
            )
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        XLSX.utils.book_append_sheet(wb, ws, "Students");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=sample-student-health-records.xlsx",
            },
        });
    } catch (e: any) {
        console.error("SAMPLE EXCEL ERROR:", e);
        return new NextResponse(e.message || "Failed to generate Excel", { status: 500 });
    }
}
