import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    const result = db.users.map(u => {
        const { passwordHash, ...safeUser } = u;
        return {
            ...safeUser,
            school: db.schools.find(s => s.id === u.schoolId)
        };
    });

    return NextResponse.json(result);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, password, role, fullName, email, schoolId } = await req.json();

    const db = readDb();
    if (db.users.some(u => u.username === username)) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
        id: `user-${Date.now()}`,
        username,
        passwordHash,
        role,
        fullName,
        email,
        schoolId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDb(db);

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
}
