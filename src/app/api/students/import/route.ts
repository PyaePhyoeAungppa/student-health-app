import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const role = (session.user as any).role;
        const userSchoolId = (session.user as any).schoolId;
        
        let targetSchoolId = userSchoolId;
        
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const formSchoolId = formData.get("schoolId") as string;
        
        if (role !== "SCHOOL_STAFF" && formSchoolId) {
            targetSchoolId = formSchoolId;
        }

        if (!targetSchoolId) {
            return NextResponse.json({ error: "No school ID associated." }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        
        const db = readDb();
        
        let studentsAdded = 0;
        let recordsAdded = 0;

        for (const row of rows) {
            // Thai Headers expected:
            // "ID", "ชั้น", "ห้อง", "เลขที่", "เลขประจำตัว", "คำนำ", "ชื่อ", "นามสกุล", 
            // "กรุ๊ปเลือด", "อายุ", "น้ำหนัก", "ส่วนสูง", "BMI", "น้ำหนักตามเกณฑ์ อายุ", 
            // "ส่วนสูงตามเกณฑ์ อายุ", "น้ำหนักตามเกณฑ์ ส่วนสูง", "การได้ยิน", "พบแพทย์", 
            // "ระยะการมอง", "ผลสายตา", "การแยกสี", "เอกซเรย์"
            
            const studentId = String(row["เลขประจำตัว"] || "").trim();
            if (!studentId || studentId === "-") continue;
            
            // Check if student exists
            let student = db.students.find(s => s.studentId === studentId && s.schoolId === targetSchoolId);
            
            if (!student) {
                student = {
                    id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    studentId: studentId,
                    orderNumber: parseInt(row["เลขที่"] || "0", 10),
                    class: `${row["ชั้น"] || ""}/${row["ห้อง"] || ""}`.replace(/^\//,"").replace(/\/$/,""),
                    gender: row["คำนำ"]?.includes("หญิง") || row["คำนำ"]?.includes("ด.ญ.") || row["คำนำ"]?.includes("น.ส.") ? "Female" : "Male",
                    prefix: row["คำนำ"] || "",
                    firstName: row["ชื่อ"] || "",
                    surName: row["นามสกุล"] || "",
                    dob: new Date().toISOString(), // Default as DB missing precise DOB in template
                    age: parseInt(row["อายุ"] || "0", 10) || null,
                    schoolId: targetSchoolId,
                    createdAt: new Date().toISOString()
                };
                db.students.push(student);
                studentsAdded++;
            }
            
            // Add Health Record
            const healthRecord = {
                id: `hr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                studentId: student.id,
                academicYear: new Date().getFullYear().toString(),
                recordedAt: new Date().toISOString(),
                bloodType: row["กรุ๊ปเลือด"] && row["กรุ๊ปเลือด"] !== "-" ? row["กรุ๊ปเลือด"] : "UNKNOWN",
                weight: parseFloat(row["น้ำหนัก"] || "0") || null,
                height: parseFloat(row["ส่วนสูง"] || "0") || null,
                bmi: parseFloat(row["BMI"] || "0") || null,
                weightByAge: row["น้ำหนักตามเกณฑ์ อายุ"] !== "-" ? row["น้ำหนักตามเกณฑ์ อายุ"] : null,
                heightByAge: row["ส่วนสูงตามเกณฑ์ อายุ"] !== "-" ? row["ส่วนสูงตามเกณฑ์ อายุ"] : null,
                weightByHeight: row["น้ำหนักตามเกณฑ์ ส่วนสูง"] !== "-" ? row["น้ำหนักตามเกณฑ์ ส่วนสูง"] : null,
                hearingTest: row["การได้ยิน"],
                doctorNote: row["พบแพทย์"],
                visionDistance: row["ระยะการมอง"],
                visionResult: row["ผลสายตา"],
                colorBlindness: row["การแยกสี"],
                xRayResult: row["เอกซเรย์"],
                createdAt: new Date().toISOString()
            };
            
            db.healthRecords.push(healthRecord);
            recordsAdded++;
        }
        
        writeDb(db);

        return NextResponse.json({ 
            success: true, 
            studentsAdded,
            recordsAdded 
        });

    } catch (e: any) {
        console.error("IMPORT ERROR:", e);
        return NextResponse.json({ error: e.message || "Failed to parse Excel" }, { status: 500 });
    }
}
