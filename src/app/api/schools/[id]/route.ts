import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const db = readDb();
    
    const index = db.schools.findIndex(s => s.id === params.id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    db.schools[index] = {
        ...db.schools[index],
        name: data.name || db.schools[index].name,
        province: data.province !== undefined ? data.province : db.schools[index].province,
        address: data.address !== undefined ? data.address : db.schools[index].address,
        updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return NextResponse.json(db.schools[index]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = readDb();
    const index = db.schools.findIndex(s => s.id === params.id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Ensure we don't delete schools that have students? (Optional but good practice)
    // For now, hard delete
    db.schools.splice(index, 1);
    
    writeDb(db);
    return NextResponse.json({ success: true });
}
