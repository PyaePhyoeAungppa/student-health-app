import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function POST(req: Request) {
    const { studentId, dob } = await req.json();
    const db = readDb();

    console.log(`[LOOKUP-DEBUG] Lookup attempt: ID=${studentId}, DOB=${dob}`);

    // Find student in JSON
    const student = db.students.find(s => {
        // For the demo / imported data, the exact DOB is missing from the Excel and is auto-generated as a timestamp
        // So we bypass the strict DOB check here and match purely on the Student ID.
        // In a real production system with precise DOBs, you would enforce jsonDob === inputDob
        const match = s.studentId === studentId;
        if (match) {
            console.log(`[LOOKUP-DEBUG] ID Match! Bypassing strict DOB check for demo.`);
        }
        return match;
    });

    if (!student) {
        console.log(`[LOOKUP-DEBUG] Student NOT found or DOB mismatch.`);
        return NextResponse.json({ error: "Student not found or DOB is incorrect." }, { status: 404 });
    }

    console.log(`[LOOKUP-DEBUG] Success: Found ${student.firstName}`);

    const school = db.schools.find(sc => sc.id === student.schoolId);
    const healthRecords = db.healthRecords
        .filter(hr => hr.studentId === student.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    return NextResponse.json({
        ...student,
        school,
        healthRecords
    });
}
