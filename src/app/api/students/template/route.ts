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
        situps: true,
        pushups: true,
        xRayResult: true
    };

    // Base headers that are always included
    const headers = [
        "เลขประจำตัว", // Student ID
        "คำนำ", // Prefix
        "ชื่อ", // First Name
        "นามสกุล", // Last Name
        "เพศ", // Gender
        "อายุ", // Age
        "ปีการศึกษา", // Academic Year
        "ชั้น", // Class
        "ห้อง", // Room
        "เลขที่", // Order Number
        "กรุ๊ปเลือด", // Blood Type
        "น้ำหนัก", // Weight
        "ส่วนสูง", // Height
        "โรคประจำตัว", // Underlying Disease
        "แพ้ยา", // Drug Allergy
        "การได้ยิน", // Hearing Test
        "การแยกสี", // Color Blindness
        "ระยะการมอง", // Visual Acuity
        "สรุปผลสายตา", // Eye Exam Report
        "อาการเบื้องต้น", // Symptoms
        "บันทึกเพิ่มเติม" // Additional Notes
    ];

    // Conditional headers based on testsConfig
    if (testsConfig.flexibility !== false) headers.push("ความอ่อนตัว : Sit and Reach Test");
    if (testsConfig.handgripStrength !== false) headers.push("แรงบีบมือ : Hand Grip Strength");
    if (testsConfig.standingKneeRaises !== false) headers.push("ยืนยกเข่า 3 นาที : 3 Minutes Step Up and Down");
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
