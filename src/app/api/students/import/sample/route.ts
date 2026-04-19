import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Create an empty worksheet with headers
        const headers = [
            "เลขประจำตัว", "รหัสบัตรประชาชน", "ชั้น", "ห้อง", "เลขที่", "คำนำ", "ชื่อ", "นามสกุล", "วันเกิด", "อายุ"
        ];

        // Create a single row of example data to help the user understand the format
        const row1 = [
            "STU001", "1100000000000", "ม.1", "1", "1", "ด.ญ.", "สมหญิง", "ใจดี", "2010/05/20", "13"
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, row1]);

        XLSX.utils.book_append_sheet(wb, ws, "Students");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=sample-students.xlsx",
            },
        });
    } catch (e: any) {
        console.error("SAMPLE EXCEL ERROR:", e);
        return new NextResponse(e.message || "Failed to generate Excel", { status: 500 });
    }
}
