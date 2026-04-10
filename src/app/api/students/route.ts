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
    const classParam = searchParams.get("class") || "";
    const genderParam = searchParams.get("gender") || "";
    const hearingParam = searchParams.get("hearing") || "";
    const colorParam = searchParams.get("colorBlindness") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "15"));

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    const db = readDb();
    let students = db.students;

    // Filter by school
    if (role === "SCHOOL_STAFF") {
        students = students.filter(s => s.schoolId === userSchoolId);
    } else if (schoolIdParam) {
        students = students.filter(s => s.schoolId === schoolIdParam);
    }

    // Search filter (name, studentId, thaiId)
    if (search) {
        students = students.filter(s =>
            s.firstName?.toLowerCase().includes(search) ||
            s.surName?.toLowerCase().includes(search) ||
            s.studentId?.toLowerCase().includes(search) ||
            s.thaiId?.toLowerCase().includes(search)
        );
    }

    // Class filter
    if (classParam) {
        students = students.filter(s => s.class?.toLowerCase().includes(classParam.toLowerCase()));
    }

    // Gender filter
    if (genderParam) {
        students = students.filter(s => s.gender === genderParam);
    }

    // Map schools and health records first so we can filter on health data
    const withHealth = students.map(s => ({
        ...s,
        school: db.schools.find(sch => sch.id === s.schoolId),
        healthRecords: db.healthRecords
            .filter(hr => hr.studentId === s.id)
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    }));

    // Hearing filter
    const afterHearing = hearingParam
        ? withHealth.filter(s => s.healthRecords[0]?.hearingTest === hearingParam)
        : withHealth;

    // Color blindness filter
    const afterColor = colorParam
        ? afterHearing.filter(s => s.healthRecords[0]?.colorBlindness === colorParam)
        : afterHearing;

    const total = afterColor.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = afterColor.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
        students: paginated,
        total,
        totalPages,
        page,
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
