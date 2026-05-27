import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { language, fullName, email, currentPassword, newPassword } = await req.json();
        
        const db = readDb();
        const userId = (session.user as any).id;
        const userIndex = db.users.findIndex((u: any) => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = db.users[userIndex];

        // 1. Language Update (if provided)
        if (language !== undefined) {
            if (!["en", "th"].includes(language)) {
                return NextResponse.json({ error: "Invalid language" }, { status: 400 });
            }
            user.language = language;
        }

        // 2. Full Name Update (if provided)
        if (fullName !== undefined) {
            const trimmedName = fullName.trim();
            if (!trimmedName) {
                return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 });
            }
            user.fullName = trimmedName;
        }

        // 4. Password Update (if newPassword provided)
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
            }

            // Compare current password hash
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }

            // Validate new password length
            if (newPassword.length < 6) {
                return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
            }

            // Hash new password
            user.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        // Save back to local JSON database
        writeDb(db);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.fullName || user.username,
                email: user.email,
                language: user.language,
                role: user.role
            }
        });
    } catch (error) {
        console.error("[API-PROFILE-PATCH] Error updating profile:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
