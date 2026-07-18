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

        const isTestEnabled = (key: string) => testsConfig ? testsConfig[key] !== false : true;

        // Build headers dynamically
        const headers = [
            "เลขประจำตัว", "รหัสบัตรประชาชน", "คำนำ", "ชื่อ", "นามสกุล", "ชั้น", "ห้อง", "เลขที่", "วันเกิด", "อายุ",
            "ปีการศึกษา", "น้ำหนัก", "ส่วนสูง",
        ];
        
        if (isTestEnabled("bloodType")) headers.push("กรุ๊ปเลือด");
        headers.push("โรคประจำตัว", "ประวัติแพ้ยา");
        if (isTestEnabled("hearingTest")) headers.push("การได้ยิน");
        if (isTestEnabled("colorBlindness")) headers.push("ตาบอดสี");
        if (isTestEnabled("visionBothEyes")) {
            headers.push("การมองเห็นซ้าย", "การมองเห็นขวา");
        }
        if (isTestEnabled("xRayResult")) headers.push("ผลเอ็กซเรย์");
        if (isTestEnabled("flexibility")) headers.push("ความอ่อนตัว");
        if (isTestEnabled("handgripStrength")) headers.push("แรงบีบมือ");
        if (isTestEnabled("standingKneeRaises")) headers.push("ยืนยกเข่า");
        if (isTestEnabled("situps")) headers.push("ลุกนั่ง");
        if (isTestEnabled("pushups")) headers.push("ดันพื้น");
        if (isTestEnabled("symptoms")) headers.push("อาการเบื้องต้น");
        headers.push("บันทึกเพิ่มเติม");

        // Helper to build a row based on config
        const buildRow = (base: any[], options: any, extras: any[]) => {
            const row = [...base];
            if (isTestEnabled("bloodType")) row.push(options.bloodType);
            row.push(options.disease, options.allergy);
            if (isTestEnabled("hearingTest")) row.push(options.hearing);
            if (isTestEnabled("colorBlindness")) row.push(options.color);
            if (isTestEnabled("visionBothEyes")) row.push(options.visionL, options.visionR);
            if (isTestEnabled("xRayResult")) row.push(options.xray);
            if (isTestEnabled("flexibility")) row.push(options.flex);
            if (isTestEnabled("handgripStrength")) row.push(options.grip);
            if (isTestEnabled("standingKneeRaises")) row.push(options.knee);
            if (isTestEnabled("situps")) row.push(options.situp);
            if (isTestEnabled("pushups")) row.push(options.pushup);
            if (isTestEnabled("symptoms")) row.push(options.symptoms);
            row.push(...extras);
            return row;
        };

        const rows = [
            buildRow(
                ["STU001", "1100102938471", "ด.ญ.", "สมหญิง", "ใจดี", "ม.1", "1", "1", "2013/05/20", "13", "2026", "45.5", "155"],
                { bloodType: "AB", disease: "-", allergy: "-", hearing: "Normal ปกติ", color: "Pass ผ่าน", visionL: "20/20", visionR: "20/20", xray: "Normal ปกติ", flex: "12", grip: "18", knee: "20", situp: "30", pushup: "15", symptoms: "-" },
                ["สุขภาพแข็งแรงดี"]
            ),
            buildRow(
                ["STU002", "1100102938472", "ด.ช.", "สมชาย", "เรียนดี", "ม.1", "1", "2", "2013/08/12", "12", "2026", "666", "160"],
                { bloodType: "O", disease: "Asthma (หอบหืด)", allergy: "-", hearing: "Normal ปกติ", color: "Pass ผ่าน", visionL: "20/30", visionR: "20/30", xray: "Normal ปกติ", flex: "10", grip: "20", knee: "15", situp: "25", pushup: "10", symptoms: "จามบ่อย" },
                ["-"]
            ),
            buildRow(
                ["STU003", "1100102938473", "ด.ญ.", "รักดี", "มีสุข", "ม.2", "1", "1", "2012/03/25", "14", "2026", "52", "1165"],
                { bloodType: "A", disease: "-", allergy: "Penicillin", hearing: "Normal ปกติ", color: "Pass ผ่าน", visionL: "20/20", visionR: "20/20", xray: "Normal ปกติ", flex: "15", grip: "22", knee: "25", situp: "40", pushup: "20", symptoms: "-" },
                ["-"]
            ),
            buildRow(
                ["STU004", "1100102938474", "ด.ช.", "เก่งกาจ", "หาญกล้า", "ม.3", "2", "5", "2011/11/02", "14", "2026", "65", "172"],
                { bloodType: "B", disease: "-", allergy: "-", hearing: "Normal ปกติ", color: "Pass ผ่าน", visionL: "20/40", visionR: "20/20", xray: "Normal ปกติ", flex: "8", grip: "25", knee: "30", situp: "45", pushup: "25", symptoms: "-" },
                ["-"]
            ),
            buildRow(
                ["STU005", "1100102938475", "ด.ญ.", "สิรินทร์", "นวลใย", "ม.3", "2", "12", "2011/04/18", "15", "2026", "48.2", "162"],
                { bloodType: "O", disease: "-", allergy: "-", hearing: "Normal ปกติ", color: "Pass ผ่าน", visionL: "20/20", visionR: "20/20", xray: "Normal ปกติ", flex: "14", grip: "21", knee: "22", situp: "35", pushup: "18", symptoms: "-" },
                ["นำแว่นสายตามาตรวจด้วย"]
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
