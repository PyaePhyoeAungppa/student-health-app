import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb } from "@/lib/db";
import * as XLSX from "xlsx";
// @ts-ignore
import * as XLSXStyle from "xlsx-js-style";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;
    
    const { searchParams } = new URL(req.url);
    const querySchoolId = searchParams.get("schoolId");

    let targetSchoolId = userSchoolId;
    if (role !== "SCHOOL_STAFF" && querySchoolId) {
        targetSchoolId = querySchoolId;
    }

    if (!targetSchoolId) {
        return NextResponse.json({ error: "No school ID associated." }, { status: 400 });
    }

    const db = readDb();
    const school = db.schools.find(s => s.id === targetSchoolId);
    
    if (!school) {
        return NextResponse.json({ error: "School not found." }, { status: 404 });
    }

    // Default configuration if not set
    const testsConfig = school.testsConfig || {
        flexibility: true,
        handgripStrength: true,
        standingKneeRaises: true,
        chairStand: true,
        situps: true,
        pushups: true,
        xRayResult: true
    };

    const headers = [];
    if (testsConfig.studentId !== false) headers.push("เลขประจำตัว"); // Student ID
    if (testsConfig.nationalId !== false) headers.push("เลขประจำตัวประชาชน"); // National ID
    headers.push("คำนำ", "ชื่อ", "นามสกุล");
    if (testsConfig.gender !== false) headers.push("เพศ"); // Gender
    headers.push("อายุ", "ปีการศึกษา", "ชั้น", "ห้อง", "เลขที่");
    if (testsConfig.bloodType !== false) headers.push("กรุ๊ปเลือด"); // Blood Type
    headers.push("น้ำหนัก", "ส่วนสูง");
    
    if (testsConfig.congenitalDisease !== false) headers.push("โรคประจำตัว"); // Underlying Disease
    if (testsConfig.drugAllergy !== false) headers.push("แพ้ยา"); // Drug Allergy
    if (testsConfig.hearingTest !== false) headers.push("การได้ยิน"); // Hearing Test
    if (testsConfig.colorBlindness !== false) headers.push("การแยกสี"); // Color Blindness
    if (testsConfig.eyeTest !== false) headers.push("ระยะการมอง"); // Visual Acuity
    if (testsConfig.visualAcuity !== false) headers.push("สรุปผลสายตา"); // Eye Exam Report
    if (testsConfig.symptoms !== false) headers.push("อาการเบื้องต้น"); // Symptoms
    if (testsConfig.bodyExamination !== false) headers.push("ผลตรวจสุขภาพ"); // Body Examination
    headers.push("บันทึกเพิ่มเติม"); // Additional Notes

    // Conditional headers based on testsConfig
    if (testsConfig.flexibility !== false) headers.push("ความอ่อนตัว : Sit and Reach Test");
    if (testsConfig.handgripStrength !== false) headers.push("แรงบีบมือ : Hand Grip Strength");
    if (testsConfig.standingKneeRaises !== false) headers.push("ยืนยกเข่า 3 นาที : 3 Minutes Step Up and Down");
    if (testsConfig.chairStand !== false) headers.push("ยืน-นั่งบนเก้าอี้ 60 วินาที : 60-Second Chair Stand");
    if (testsConfig.situps !== false) headers.push("ลุก-นั่ง 60 วินาที : 60 Seconds Sit-ups");
    if (testsConfig.pushups !== false) headers.push("ดันพื้นประยุกต์ 30 วินาที : 30 Seconds Modified Push-ups");
    if (testsConfig.xRayResult !== false) headers.push("X-Ray");
    if (testsConfig.cbc !== false) headers.push("ความสมบูรณ์ของเม็ดเลือด (CBC)");
    if (testsConfig.fbs !== false) headers.push("ระดับน้ำตาลในเลือด (FBS)");
    if (testsConfig.cholesterol !== false) headers.push("ระดับไขมันในเลือด (Cholesterol)");
    if (testsConfig.hbsag !== false) headers.push("ตรวจหาเชื้อไวรัสตับอักเสบบี (HBSAG)");
    if (testsConfig.ua !== false) headers.push("ตรวจปัสสาวะทั่วไป (UA)");
    if (testsConfig.amphetamine !== false) headers.push("ตรวจหาสารเสพติดในปัสสาวะ (Amphetamine)");

    // Custom Fields headers
    if (school.customFields && Array.isArray(school.customFields)) {
        school.customFields.forEach((field: any) => {
            headers.push(field.label);
            if (field.allowExtraDescription) {
                headers.push(`${field.label} (Description)`);
            }
        });
    }

    // Create workbook and worksheet
    const wb = XLSXStyle.utils.book_new();
    const ws = XLSXStyle.utils.aoa_to_sheet([headers]);

    // Style the header row
    for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
            ws[cellRef].s = {
                fill: { patternType: "solid", fgColor: { rgb: "E2E8F0" } },
                font: { bold: true, color: { rgb: "1E293B" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
    }

    // Set column widths
    ws["!cols"] = headers.map(() => ({ wch: 20 })); // Give all columns a width of 20

    XLSXStyle.utils.book_append_sheet(wb, ws, "Template");
    const buffer = XLSXStyle.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="import-template-${school.name.replace(/\s+/g, "_")}.xlsx"`
        }
    });
}
