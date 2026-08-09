import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    return NextResponse.json(db.settings || { ageValidations: [] });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const db = readDb();

        db.settings = {
            ...db.settings,
            ...body
        };

        writeDb(db);
        return NextResponse.json(db.settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
    }
}
