import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function POST(req: Request) {
    const { studentId, dob } = await req.json();
    const db = readDb();

    console.log(`[LOOKUP-DEBUG] Lookup attempt: ID=${studentId}, DOB=${dob}`);

    // Find student in JSON
    const student = db.students.find(s => {
        const jsonDob = new Date(s.dob).toISOString().split("T")[0];
        const inputDob = new Date(dob).toISOString().split("T")[0];
        const match = s.studentId === studentId && jsonDob === inputDob;
        if (s.studentId === studentId) {
            console.log(`[LOOKUP-DEBUG] ID Match! Comparing dates: JSON=${jsonDob} vs INPUT=${inputDob}`);
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
