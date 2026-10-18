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

        const optionalKeys = ["studentId", "nationalId", "gender", "bloodType", "congenitalDisease", "drugAllergy", "hearingTest", "colorBlindness", "visualAcuity", "eyeExamReport", "bodyExamination", "symptoms", "handgripStrength", "standingKneeRaises", "situps", "pushups", "flexibility", "xRayResult"];
        const isTestEnabled = (key: string) => {
            if (!optionalKeys.includes(key)) return true;
            return testsConfig ? testsConfig[key] !== false : true;
        };

        // Build headers dynamically
        const headers = [];
        if (isTestEnabled("studentId")) headers.push("เลขประจำตัว");
        if (isTestEnabled("nationalId")) headers.push("เลขประจำตัวประชาชน");
        
        headers.push("คำนำ", "ชื่อ", "นามสกุล");
        if (isTestEnabled("gender")) headers.push("เพศ");
        
        headers.push("ชั้น", "ห้อง", "เลขที่", "อายุ", "ปีการศึกษา", "น้ำหนัก", "ส่วนสูง");
        
        if (isTestEnabled("bloodType")) headers.push("กรุ๊ปเลือด");
        if (isTestEnabled("congenitalDisease")) headers.push("โรคประจำตัว");
        if (isTestEnabled("drugAllergy")) headers.push("แพ้ยา");
        if (isTestEnabled("hearingTest")) headers.push("การได้ยิน");
        if (isTestEnabled("colorBlindness")) headers.push("การแยกสี");
        if (isTestEnabled("visualAcuity")) headers.push("ระยะการมอง"); // eyeTest in UI
        if (isTestEnabled("eyeExamReport")) headers.push("สรุปผลสายตา"); // visualAcuity in UI
        if (isTestEnabled("xRayResult")) headers.push("ผลเอกซเรย์");
        if (isTestEnabled("flexibility")) headers.push("ความอ่อนตัว : Sit and Reach Test");
        if (isTestEnabled("handgripStrength")) headers.push("แรงบีบมือ : Hand Grip Strength");
        if (isTestEnabled("standingKneeRaises")) headers.push("ยืนยกเข่า 3 นาที : 3 Minutes Step Up and Down");
        if (isTestEnabled("situps")) headers.push("ลุก-นั่ง 60 วินาที : 60 Seconds Sit-ups");
        if (isTestEnabled("pushups")) headers.push("ดันพื้นประยุกต์ 30 วินาที : 30 Seconds Modified Push-ups");
        if (isTestEnabled("symptoms")) headers.push("อาการเบื้องต้น");
        if (isTestEnabled("bodyExamination")) headers.push("ผลตรวจสุขภาพ");
        headers.push("บันทึกเพิ่มเติม");

        // Helper to build a row based on config
        const buildRow = (d: any) => {
            const row = [];
            if (isTestEnabled("studentId")) row.push(d.studentId);
            if (isTestEnabled("nationalId")) row.push(d.nationalId);
            row.push(d.prefix, d.firstName, d.lastName);
            if (isTestEnabled("gender")) row.push(d.gender);
            row.push(d.class, d.room, d.order, d.age, d.year, d.weight, d.height);
            
            if (isTestEnabled("bloodType")) row.push(d.bloodType);
            if (isTestEnabled("congenitalDisease")) row.push(d.disease);
            if (isTestEnabled("drugAllergy")) row.push(d.allergy);
            if (isTestEnabled("hearingTest")) row.push(d.hearing);
            if (isTestEnabled("colorBlindness")) row.push(d.color);
            if (isTestEnabled("visualAcuity")) row.push(d.visualAcuity);
            if (isTestEnabled("eyeExamReport")) row.push(d.eyeExamReport);
            if (isTestEnabled("xRayResult")) row.push(d.xray);
            if (isTestEnabled("flexibility")) row.push(d.flex);
            if (isTestEnabled("handgripStrength")) row.push(d.grip);
            if (isTestEnabled("standingKneeRaises")) row.push(d.knee);
            if (isTestEnabled("situps")) row.push(d.situp);
            if (isTestEnabled("pushups")) row.push(d.pushup);
            if (isTestEnabled("symptoms")) row.push(d.symptoms);
            if (isTestEnabled("bodyExamination")) row.push(d.bodyExamination);
            row.push(d.notes);
            return row;
        };

        const rows = [
            buildRow({
                studentId: "STU001", nationalId: "1103701234567", prefix: "ด.ญ.", firstName: "สมหญิง", lastName: "ใจดี", gender: "หญิง",
                class: "ม.1", room: "1", order: "1", age: "13", year: "2026", weight: "45.5", height: "155",
                bloodType: "AB", disease: "-", allergy: "-", hearing: "ปกติ Normal", color: "ปกติ normal",
                visualAcuity: "20/20", eyeExamReport: "ปกติ - normal", xray: "normal", flex: "12", grip: "18", knee: "20", situp: "30", pushup: "15",
                symptoms: "ปกติ normal", bodyExamination: "ปกติ", notes: "สุขภาพแข็งแรงดี"
            }),
            buildRow({
                studentId: "STU002", nationalId: "1103701234568", prefix: "ด.ช.", firstName: "สมชาย", lastName: "เรียนดี", gender: "ชาย",
                class: "ม.1", room: "1", order: "2", age: "12", year: "2026", weight: "666", height: "160",
                bloodType: "O", disease: "Asthma (หอบหืด)", allergy: "-", hearing: "ปกติ Normal", color: "ปกติ normal",
                visualAcuity: "20/30", eyeExamReport: "ควรเริ่มดูแลสายตา - Eye care recommended", xray: "normal", flex: "10", grip: "20", knee: "15", situp: "25", pushup: "10",
                symptoms: "ผิดปกติ Abnormal จามบ่อย", bodyExamination: "ปกติ", notes: "-"
            }),
            buildRow({
                studentId: "STU003", nationalId: "1103701234569", prefix: "ด.ญ.", firstName: "รักดี", lastName: "มีสุข", gender: "หญิง",
                class: "ม.2", room: "1", order: "1", age: "14", year: "2026", weight: "52", height: "165",
                bloodType: "A", disease: "-", allergy: "Penicillin", hearing: "ปกติ Normal", color: "ปกติ normal",
                visualAcuity: "20/40", eyeExamReport: "ผิดปกติ - abnormal", xray: "normal", flex: "15", grip: "15", knee: "18", situp: "20", pushup: "12",
                symptoms: "ปกติ normal", bodyExamination: "ปกติ", notes: "ควรพบจักษุแพทย์"
            }),
            buildRow({
                studentId: "STU004", nationalId: "1103701234570", prefix: "ด.ช.", firstName: "เก่งกาจ", lastName: "หาญกล้า", gender: "ชาย",
                class: "ม.3", room: "2", order: "5", age: "14", year: "2026", weight: "65", height: "172",
                bloodType: "B", disease: "-", allergy: "-", hearing: "ปกติ Normal", color: "ผิดปกติ abnormal",
                visualAcuity: "20/200", eyeExamReport: "ผิดปกติ - abnormal", xray: "normal", flex: "8", grip: "25", knee: "30", situp: "45", pushup: "25",
                symptoms: "ปกติ normal", bodyExamination: "ปกติ", notes: "-"
            })
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
