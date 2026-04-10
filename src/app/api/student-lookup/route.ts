import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function POST(req: Request) {
    const { studentId, dob } = await req.json();
    const db = readDb();

    console.log(`[LOOKUP-DEBUG] Lookup attempt: ID=${studentId}, DOB=${dob}`);

    if (!dob) {
        return NextResponse.json({ error: "Date of Birth is required." }, { status: 400 });
    }

    // Find matching student by studentId or thaiId
    const potentialStudents = db.students.filter((s: any) => s.studentId === studentId || s.thaiId === studentId);

    let student = null;

    for (const s of potentialStudents) {
        try {
            const dbDate = new Date(s.dob);
            const dbFormatted = `${dbDate.getFullYear()}/${String(dbDate.getMonth() + 1).padStart(2, '0')}/${String(dbDate.getDate()).padStart(2, '0')}`;

            // Normalize input: support YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD, YYYYMMDD
            let normalizedInput = dob.replace(/-/g, '/').replace(/\./g, '/').trim();
            if (/^\d{8}$/.test(normalizedInput)) {
                // YYYYMMDD → YYYY/MM/DD
                normalizedInput = `${normalizedInput.slice(0, 4)}/${normalizedInput.slice(4, 6)}/${normalizedInput.slice(6, 8)}`;
            }

            if (dbFormatted === normalizedInput) {
                student = s;
                break;
            } else {
                console.log(`[LOOKUP-DEBUG] DOB mismatch: DB=${dbFormatted}, Input=${normalizedInput}`);
            }
        } catch (e) {
            console.error("Error parsing DOB", e);
        }
    }

    if (!student) {
        console.log(`[LOOKUP-DEBUG] Student NOT found or DOB mismatch.`);
        return NextResponse.json({ error: "Student not found or Date of Birth is incorrect." }, { status: 401 });
    }

    console.log(`[LOOKUP-DEBUG] Success: Found ${student.firstName}`);

    const school = db.schools.find((sc: any) => sc.id === student.schoolId);
    const healthRecords = db.healthRecords
        .filter((hr: any) => hr.studentId === student.id)
        .sort((a: any, b: any) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    return NextResponse.json({ ...student, school, healthRecords });
}

