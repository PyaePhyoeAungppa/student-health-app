import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const schoolIdParam = searchParams.get("schoolId");

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    const db = readDb();
    let students = db.students;

    // Filter by school if applicable
    if (role === "SCHOOL_STAFF") {
        students = students.filter(s => s.schoolId === userSchoolId);
    } else if (schoolIdParam) {
        students = students.filter(s => s.schoolId === schoolIdParam);
    }

    // Search filter
    if (search) {
        students = students.filter(s =>
            s.firstName.toLowerCase().includes(search) ||
            s.surName.toLowerCase().includes(search) ||
            s.studentId.toLowerCase().includes(search)
        );
    }

    // Map schools for UI
    const result = students.map(s => ({
        ...s,
        school: db.schools.find(sch => sch.id === s.schoolId),
        healthRecords: db.healthRecords.filter(hr => hr.studentId === s.id).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    }));

    return NextResponse.json({
        students: result,
        total: result.length,
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    const data = await req.json();
    const db = readDb();

    const newStudent = {
        ...data,
        id: `stu-${Date.now()}`,
        schoolId: role === "SCHOOL_STAFF" ? userSchoolId : data.schoolId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.students.push(newStudent);
    writeDb(db);

    return NextResponse.json(newStudent, { status: 201 });
}
