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
