import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    const effectiveSchoolId = role === "SCHOOL_STAFF" ? userSchoolId : schoolId;

    const db = readDb();

    let students = db.students;
    if (effectiveSchoolId) {
        students = students.filter(s => s.schoolId === effectiveSchoolId);
    }

    const studentIds = students.map(s => s.id);
    const healthRecords = db.healthRecords.filter(hr => studentIds.includes(hr.studentId));

    // Calculate distributions
    const genderMap: Record<string, number> = {};
    students.forEach(s => genderMap[s.gender] = (genderMap[s.gender] || 0) + 1);

    const hearingMap: Record<string, number> = {};
    const colorBlindMap: Record<string, number> = {};
    const bloodTypeMap: Record<string, number> = {};
    const bmis: number[] = [];

    healthRecords.forEach(hr => {
        if (hr.hearingTest) hearingMap[hr.hearingTest] = (hearingMap[hr.hearingTest] || 0) + 1;
        if (hr.colorBlindness) colorBlindMap[hr.colorBlindness] = (colorBlindMap[hr.colorBlindness] || 0) + 1;
        if (hr.bloodType) bloodTypeMap[hr.bloodType] = (bloodTypeMap[hr.bloodType] || 0) + 1;
        if (hr.bmi) bmis.push(hr.bmi);
    });

    const avgBmi = bmis.length ? parseFloat((bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1)) : 0;

    return NextResponse.json({
        totalStudents: students.length,
        totalRecords: healthRecords.length,
        avgBmi,
        bmiDistribution: {
            underweight: bmis.filter(b => b < 18.5).length,
            normal: bmis.filter(b => b >= 18.5 && b < 25).length,
            overweight: bmis.filter(b => b >= 25 && b < 30).length,
            obese: bmis.filter(b => b >= 30).length,
        },
        hearingStats: Object.keys(hearingMap).map(k => ({ hearingTest: k, _count: hearingMap[k] })),
        colorBlindStats: Object.keys(colorBlindMap).map(k => ({ colorBlindness: k, _count: colorBlindMap[k] })),
        bloodTypeStats: Object.keys(bloodTypeMap).map(k => ({ bloodType: k, _count: bloodTypeMap[k] })),
        genderStats: Object.keys(genderMap).map(k => ({ gender: k, _count: genderMap[k] })),
    });
}
