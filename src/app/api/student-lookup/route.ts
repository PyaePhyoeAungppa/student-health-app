import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function POST(req: Request) {
    const { studentId, dob } = await req.json();
    const db = readDb();

    // Find student in JSON
    const student = db.students.find(s =>
        s.studentId === studentId &&
        new Date(s.dob).toISOString().split("T")[0] === new Date(dob).toISOString().split("T")[0]
    );

    if (!student) {
        return NextResponse.json({ error: "Student not found or DOB is incorrect." }, { status: 404 });
    }

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
