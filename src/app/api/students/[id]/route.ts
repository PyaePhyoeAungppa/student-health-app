import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findUnique({
        where: { id: params.id },
        include: {
            school: true,
            healthRecords: { orderBy: { recordedAt: "desc" } },
        },
    });

    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;
    if (role === "SCHOOL_STAFF" && student.schoolId !== userSchoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(student);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SCHOOL_STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const { schoolId, ...updateData } = data;
    const student = await prisma.student.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json(student);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
