import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    const effectiveSchoolId = role === "SCHOOL_STAFF" ? userSchoolId : schoolId;

    const where: any = {};
    if (effectiveSchoolId) where.schoolId = effectiveSchoolId;

    const [
        totalStudents,
        totalRecords,
        bmiStats,
        hearingStats,
        colorBlindStats,
        bloodTypeStats,
        genderStats,
    ] = await Promise.all([
        prisma.student.count({ where }),
        prisma.healthRecord.count({ where: { student: { schoolId: effectiveSchoolId } } }),
        prisma.healthRecord.findMany({
            where: { student: { schoolId: effectiveSchoolId }, bmi: { not: null } },
            select: { bmi: true },
        }),
        prisma.healthRecord.groupBy({
            by: ["hearingTest"],
            where: { student: { schoolId: effectiveSchoolId } },
            _count: true,
        }),
        prisma.healthRecord.groupBy({
            by: ["colorBlindness"],
            where: { student: { schoolId: effectiveSchoolId } },
            _count: true,
        }),
        prisma.healthRecord.groupBy({
            by: ["bloodType"],
            where: { student: { schoolId: effectiveSchoolId } },
            _count: true,
        }),
        prisma.student.groupBy({
            by: ["gender"],
            where,
            _count: true,
        }),
    ]);

    const bmis = bmiStats.map((r) => r.bmi!).filter(Boolean);
    const avgBmi = bmis.length ? parseFloat((bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1)) : 0;
    const underweight = bmis.filter((b) => b < 18.5).length;
    const normalWeight = bmis.filter((b) => b >= 18.5 && b < 25).length;
    const overweight = bmis.filter((b) => b >= 25 && b < 30).length;
    const obese = bmis.filter((b) => b >= 30).length;

    return NextResponse.json({
        totalStudents,
        totalRecords,
        avgBmi,
        bmiDistribution: { underweight, normal: normalWeight, overweight, obese },
        hearingStats,
        colorBlindStats,
        bloodTypeStats,
        genderStats,
    });
}
