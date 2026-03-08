import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { language } = await req.json();
        if (!language || !["en", "th"].includes(language)) {
            return NextResponse.json({ error: "Invalid language" }, { status: 400 });
        }

        const db = readDb();
        const userId = (session.user as any).id;
        const userIndex = db.users.findIndex((u: any) => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        db.users[userIndex].language = language;
        writeDb(db);

        return NextResponse.json({ success: true, language });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
