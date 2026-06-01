import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { studentId, password, action } = await req.json();
        
        console.log(`[LOOKUP-DEBUG] Lookup attempt: ID=${studentId}, Action=${action}`);

        if (!studentId) {
            return NextResponse.json({ error: "Student ID or Thai ID is required." }, { status: 400 });
        }

        const db = readDb();
        const student = db.students.find((s: any) => s.studentId === studentId || s.thaiId === studentId);

        if (!student) {
            console.log(`[LOOKUP-DEBUG] Student NOT found for ID: ${studentId}`);
            return NextResponse.json({ error: "studentNotFound" }, { status: 404 });
        }

        const hasPassword = !!student.passwordHash;

        if (action === "check") {
            return NextResponse.json({ exists: true, hasPassword });
        }

        if (action === "register") {
            if (hasPassword) {
                return NextResponse.json({ error: "Password already set." }, { status: 400 });
            }
            if (!password || password.length < 6) {
                return NextResponse.json({ error: "passwordTooShort" }, { status: 400 });
            }

            const hash = await bcrypt.hash(password, 10);
            
            // Update student record in DB
            const index = db.students.findIndex((s: any) => s.id === student.id);
            db.students[index] = {
                ...db.students[index],
                passwordHash: hash,
                updatedAt: new Date().toISOString()
            };
            writeDb(db);
            
            console.log(`[LOOKUP-DEBUG] Password created successfully for: ${student.firstName}`);
            
            const school = db.schools.find((sc: any) => sc.id === student.schoolId);
            const healthRecords = db.healthRecords
                .filter((hr: any) => hr.studentId === student.id)
                .sort((a: any, b: any) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

            return NextResponse.json({ ...db.students[index], school, healthRecords });
        }

        if (action === "login") {
            if (!hasPassword) {
                return NextResponse.json({ error: "Password not set." }, { status: 400 });
            }
            if (!password) {
                return NextResponse.json({ error: "Password is required." }, { status: 400 });
            }

            const isValid = await bcrypt.compare(password, student.passwordHash);
            if (!isValid) {
                console.log(`[LOOKUP-DEBUG] Incorrect password for: ${student.firstName}`);
                return NextResponse.json({ error: "incorrectPassword" }, { status: 401 });
            }

            console.log(`[LOOKUP-DEBUG] Success: Found and authenticated ${student.firstName}`);

            const school = db.schools.find((sc: any) => sc.id === student.schoolId);
            const healthRecords = db.healthRecords
                .filter((hr: any) => hr.studentId === student.id)
                .sort((a: any, b: any) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

            return NextResponse.json({ ...student, school, healthRecords });
        }

        return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    } catch (error) {
        console.error("[LOOKUP-DEBUG] ERROR during student lookup:", error);
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}

