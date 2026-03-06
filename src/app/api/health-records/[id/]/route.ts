import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "SCHOOL_STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const db = readDb();
    const index = db.healthRecords.findIndex(hr => hr.id === params.id);

    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (data.weight && data.height) {
        const hm = data.height / 100;
        data.bmi = parseFloat((data.weight / (hm * hm)).toFixed(1));
    }

    db.healthRecords[index] = {
        ...db.healthRecords[index],
        ...data,
        updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return NextResponse.json(db.healthRecords[index]);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN" && role !== "COMPANY_STAFF") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = readDb();
    const index = db.healthRecords.findIndex(hr => hr.id === params.id);
    if (index !== -1) {
        db.healthRecords.splice(index, 1);
        writeDb(db);
    }

    return NextResponse.json({ success: true });
}
