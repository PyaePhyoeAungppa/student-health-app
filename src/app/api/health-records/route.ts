import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const records = await prisma.healthRecord.findMany({
        where,
        include: { student: { include: { school: true } } },
        orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(records);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SCHOOL_STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();

    // Auto-calculate BMI
    if (data.weight && data.height) {
        const hm = data.height / 100;
        data.bmi = parseFloat((data.weight / (hm * hm)).toFixed(1));
    }

    const record = await prisma.healthRecord.create({ data });
    return NextResponse.json(record, { status: 201 });
}
