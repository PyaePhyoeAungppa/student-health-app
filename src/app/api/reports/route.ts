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

    const hrWhere: any = {};
    if (effectiveSchoolId) hrWhere.student = { schoolId: effectiveSchoolId };

    const [
        totalStudents,
        totalRecords,
        allRecords,
        genderStatsRaw,
    ] = await Promise.all([
        prisma.student.count({ where }),
        prisma.healthRecord.count({ where: hrWhere }),
        prisma.healthRecord.findMany({
            where: hrWhere,
            select: { bmi: true, hearingTest: true, colorBlindness: true, bloodType: true },
        }),
        prisma.student.groupBy({
            by: ["gender"],
            where,
            _count: true,
        }),
    ]);

    const hearingMap: Record<string, number> = {};
    const colorBlindMap: Record<string, number> = {};
    const bloodTypeMap: Record<string, number> = {};

    allRecords.forEach((r: any) => {
        if (r.hearingTest) hearingMap[r.hearingTest] = (hearingMap[r.hearingTest] || 0) + 1;
        if (r.colorBlindness) colorBlindMap[r.colorBlindness] = (colorBlindMap[r.colorBlindness] || 0) + 1;
        if (r.bloodType) bloodTypeMap[r.bloodType] = (bloodTypeMap[r.bloodType] || 0) + 1;
    });

    const hearingStats = Object.keys(hearingMap).map(k => ({ hearingTest: k, _count: hearingMap[k] }));
    const colorBlindStats = Object.keys(colorBlindMap).map(k => ({ colorBlindness: k, _count: colorBlindMap[k] }));
    const bloodTypeStats = Object.keys(bloodTypeMap).map(k => ({ bloodType: k, _count: bloodTypeMap[k] }));

    const genderStats = genderStatsRaw;

    const bmis = allRecords.map((r: any) => r.bmi!).filter(Boolean);
    const avgBmi = bmis.length ? parseFloat((bmis.reduce((a: number, b: number) => a + b, 0) / bmis.length).toFixed(1)) : 0;
    const underweight = bmis.filter((b: number) => b < 18.5).length;
    const normalWeight = bmis.filter((b: number) => b >= 18.5 && b < 25).length;
    const overweight = bmis.filter((b: number) => b >= 25 && b < 30).length;
    const obese = bmis.filter((b: number) => b >= 30).length;

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
