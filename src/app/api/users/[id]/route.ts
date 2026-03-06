import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SYSTEM_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (params.id === (session.user as any).id) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
