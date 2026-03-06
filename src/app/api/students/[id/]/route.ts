import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    const student = db.students.find(s => s.id === params.id);

    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;
    if (role === "SCHOOL_STAFF" && student.schoolId !== userSchoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Populate school and health records
    const result = {
        ...student,
        school: db.schools.find(s => s.id === student.schoolId),
        healthRecords: db.healthRecords
            .filter(hr => hr.studentId === student.id)
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    };

    return NextResponse.json(result);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SCHOOL_STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const db = readDb();
    const index = db.students.findIndex(s => s.id === params.id);

    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    db.students[index] = {
        ...db.students[index],
        ...data,
        updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return NextResponse.json(db.students[index]);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = readDb();
    const studentIndex = db.students.findIndex(s => s.id === params.id);

    if (studentIndex !== -1) {
        // Also delete related health records
        db.healthRecords = db.healthRecords.filter(hr => hr.studentId !== params.id);
        db.students.splice(studentIndex, 1);
        writeDb(db);
    }

    return NextResponse.json({ success: true });
}
