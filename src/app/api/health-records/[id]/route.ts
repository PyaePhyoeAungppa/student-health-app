import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SCHOOL_STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();

    if (data.weight && data.height) {
        const hm = data.height / 100;
        data.bmi = parseFloat((data.weight / (hm * hm)).toFixed(1));
    }

    const record = await prisma.healthRecord.update({
        where: { id: params.id },
        data,
    });

    return NextResponse.json(record);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN" && role !== "COMPANY_STAFF") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.healthRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
