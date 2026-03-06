import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const { studentId, dob } = await req.json();
    if (!studentId || !dob) {
        return NextResponse.json({ error: "Student ID and Date of Birth are required." }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
        where: { studentId },
        include: {
            school: true,
            healthRecords: {
                orderBy: { recordedAt: "desc" },
                take: 1,
            },
        },
    });

    if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const studentDob = new Date(student.dob).toISOString().split("T")[0];
    const inputDob = new Date(dob).toISOString().split("T")[0];

    if (studentDob !== inputDob) {
        return NextResponse.json({ error: "Date of birth does not match." }, { status: 403 });
    }

    return NextResponse.json({ student });
}
