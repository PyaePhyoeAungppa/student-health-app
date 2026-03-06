import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const db = readDb();
    let records = db.healthRecords;

    if (studentId) {
        records = records.filter(r => r.studentId === studentId);
    }

    // Sort by recordedAt desc
    records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    // Populate data for table
    const result = records.map(r => {
        const student = db.students.find(s => s.id === r.studentId);
        const school = db.schools.find(s => s.id === (student?.schoolId));
        return {
            ...r,
            student,
            school
        };
    });

    return NextResponse.json(result);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const db = readDb();

    const newRecord = {
        ...data,
        id: `hr-${Date.now()}`,
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.healthRecords.push(newRecord);
    writeDb(db);

    return NextResponse.json(newRecord, { status: 201 });
}
