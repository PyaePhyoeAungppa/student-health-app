import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const schoolId = searchParams.get("schoolId");
    const classFilter = searchParams.get("class");

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    let whereClause: any = {};
    if (role === "SCHOOL_STAFF") {
        whereClause.schoolId = userSchoolId;
    } else if (schoolId) {
        whereClause.schoolId = schoolId;
    }
    if (classFilter) whereClause.class = classFilter;
    if (search) {
        whereClause.OR = [
            { firstName: { contains: search } },
            { surName: { contains: search } },
            { studentId: { contains: search } },
        ];
    }

    const [students, total] = await Promise.all([
        prisma.student.findMany({
            where: whereClause,
            include: {
                school: true,
                healthRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { class: "asc" },
        }),
        prisma.student.count({ where: whereClause }),
    ]);

    return NextResponse.json({ students, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SCHOOL_STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const student = await prisma.student.create({ data });
    return NextResponse.json(student, { status: 201 });
}
