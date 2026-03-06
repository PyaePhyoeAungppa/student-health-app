import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
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
                    console.log(`[AUTH] Attempting login for user: ${credentials.username}`);
                    const user = await prisma.user.findUnique({
                        where: { username: credentials.username },
                        include: { school: true },
                    });

                    if (!user) {
                        console.log(`[AUTH] User not found: ${credentials.username}`);
                        return null;
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                    if (!isValid) {
                        console.log(`[AUTH] Invalid password for: ${credentials.username}`);
                        return null;
                    }

                    console.log(`[AUTH] Login successful: ${credentials.username} (${user.role})`);
                    return {
                        id: user.id,
                        name: user.fullName || user.username,
                        email: user.email,
                        role: user.role,
                        schoolId: user.schoolId,
                        schoolName: user.school?.name,
                    };
                } catch (error) {
                    console.error("[AUTH] Database connection error during login:", error);
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
