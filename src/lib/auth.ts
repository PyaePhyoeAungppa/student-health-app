import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { readDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;
                try {
                    console.log(`[AUTH-DEBUG] Login attempt: username="${credentials.username}"`);
                    const db = readDb();

                    if (!db || !db.users) {
                        console.error("[AUTH-DEBUG] Database or users array is missing!");
                        return null;
                    }

                    const user = db.users.find(u => u.username === credentials.username);
                    if (!user) {
                        console.log(`[AUTH-DEBUG] User NOT found in JSON for: ${credentials.username}`);
                        return null;
                    }

                    console.log(`[AUTH-DEBUG] User found: ${user.username}. Comparing password...`);
                    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                    if (!isValid) {
                        console.log(`[AUTH-DEBUG] Password MISMATCH for: ${credentials.username}`);
                        return null;
                    }

                    const school = db.schools.find(s => s.id === user.schoolId);
                    console.log(`[AUTH-DEBUG] Login SUCCESS: ${user.username}`);

                    return {
                        id: user.id,
                        name: user.fullName || user.username,
                        email: user.email,
                        role: user.role,
                        schoolId: user.schoolId,
                        schoolName: school?.name,
                    };
                } catch (error) {
                    console.error("[AUTH-DEBUG] ERROR during authorize:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.schoolId = (user as any).schoolId;
                token.schoolName = (user as any).schoolName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).schoolId = token.schoolId;
                (session.user as any).schoolName = token.schoolName;
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
