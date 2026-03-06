import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    const sortedSchools = [...db.schools].sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(sortedSchools);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const db = readDb();

    const newSchool = {
        ...data,
        id: `school-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.schools.push(newSchool);
    writeDb(db);

    return NextResponse.json(newSchool, { status: 201 });
}
