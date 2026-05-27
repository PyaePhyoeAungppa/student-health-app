import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Create headers matching Thai requirements for full profile + health data
        const headers = [
            "เลขประจำตัว", "รหัสบัตรประชาชน", "คำนำ", "ชื่อ", "นามสกุล", "ชั้น", "ห้อง", "เลขที่", "วันเกิด", "อายุ",
            "ปีการศึกษา", "น้ำหนัก", "ส่วนสูง", "กรุ๊ปเลือด", "โรคประจำตัว", "ประวัติแพ้ยา", 
            "การได้ยิน", "ตาบอดสี", "การมองเห็นซ้าย", "การมองเห็นขวา", "ผลเอ็กซเรย์", 
            "ความอ่อนตัว", "แรงบีบมือ", "อาการเบื้องต้น", "บันทึกเพิ่มเติม"
        ];

        // 5 rows of dummy data. Row 2 and 3 include intentional errors (typos) for demonstration
        const rows = [
            // Row 1: Complete and Normal
            [
                "STU001", "1100102938471", "ด.ญ.", "สมหญิง", "ใจดี", "ม.1", "1", "1", "2013/05/20", "13",
                "2026", "45.5", "155", "AB", "-", "-", "Normal ปกติ", "Pass ผ่าน", "20/20", "20/20", "Normal ปกติ",
                "12", "18", "-", "สุขภาพแข็งแรงดี"
            ],
            // Row 2: Weight Typo (666 kg)
            [
                "STU002", "1100102938472", "ด.ช.", "สมชาย", "เรียนดี", "ม.1", "1", "2", "2013/08/12", "12",
                "2026", "666", "160", "O", "Asthma (หอบหืด)", "-", "Normal ปกติ", "Pass ผ่าน", "20/30", "20/30", "Normal ปกติ",
                "10", "20", "จามบ่อย", "-"
            ],
            // Row 3: Height Typo (1165 cm)
            [
                "STU003", "1100102938473", "ด.ญ.", "รักดี", "มีสุข", "ม.2", "1", "1", "2012/03/25", "14",
                "2026", "52", "1165", "A", "-", "Penicillin", "Normal ปกติ", "Pass ผ่าน", "20/20", "20/20", "Normal ปกติ",
                "15", "22", "-", "-"
            ],
            // Row 4: Normal
            [
                "STU004", "1100102938474", "ด.ช.", "เก่งกาจ", "หาญกล้า", "ม.3", "2", "5", "2011/11/02", "14",
                "2026", "65", "172", "B", "-", "-", "Normal ปกติ", "Pass ผ่าน", "20/40", "20/20", "Normal ปกติ",
                "8", "25", "-", "-"
            ],
            // Row 5: Normal
            [
                "STU005", "1100102938475", "ด.ญ.", "สิรินทร์", "นวลใย", "ม.3", "2", "12", "2011/04/18", "15",
                "2026", "48.2", "162", "O", "-", "-", "Normal ปกติ", "Pass ผ่าน", "20/20", "20/20", "Normal ปกติ",
                "14", "21", "-", "นำแว่นสายตามาตรวจด้วย"
            ]
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
