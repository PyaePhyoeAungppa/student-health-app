import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (params.id === (session.user as any).id) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const db = readDb();
    const index = db.users.findIndex(u => u.id === params.id);
    if (index !== -1) {
        db.users.splice(index, 1);
        writeDb(db);
    }

    return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const db = readDb();
    
    const index = db.users.findIndex(u => u.id === params.id);
    if (index === -1) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.users[index] = {
        ...db.users[index],
        username: data.username || db.users[index].username,
        // Only update password if a new one is provided
        password: data.password ? data.password : db.users[index].password, 
        fullName: data.fullName !== undefined ? data.fullName : db.users[index].fullName,
        email: data.email !== undefined ? data.email : db.users[index].email,
        role: data.role || db.users[index].role,
        schoolId: data.role === "SCHOOL_STAFF" ? (data.schoolId || "") : "",
        updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return NextResponse.json(db.users[index]);
}
