import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    const school = db.schools.find((s: any) => s.id === params.id);
    if (!school) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
        assessments: school.customAssessments ?? [],
        importedAt: school.customAssessmentsImportedAt ?? null,
    });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    // Only SYSTEM_ADMIN or the school's own SCHOOL_STAFF can write
    if (role !== "SYSTEM_ADMIN" && !(role === "SCHOOL_STAFF" && userSchoolId === params.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const db = readDb();
    const index = db.schools.findIndex((s: any) => s.id === params.id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    db.schools[index] = {
        ...db.schools[index],
        customAssessments: data.assessments ?? [],
        customAssessmentsImportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    writeDb(db);
    return NextResponse.json({ success: true, count: data.assessments?.length ?? 0 });
}
