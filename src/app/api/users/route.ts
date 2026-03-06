import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
        include: { school: true },
        orderBy: { createdAt: "desc" },
    });

    // Remove passwords before sending to client
    const safeUsers = users.map(u => {
        const { passwordHash, ...safeUser } = u;
        return safeUser;
    });

    return NextResponse.json(safeUsers);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, password, role, fullName, email, schoolId } = await req.json();

    if (!username || !password || !role) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                role,
                fullName,
                email,
                ...(schoolId ? { schoolId } : {}),
            },
        });
        const { passwordHash: _, ...safeUser } = user;
        return NextResponse.json(safeUser, { status: 201 });
    } catch (e: any) {
        if (e.code === "P2002") {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
