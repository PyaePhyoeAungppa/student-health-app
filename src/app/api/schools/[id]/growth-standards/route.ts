import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import defaultGrowthStandards from "@/lib/growth-standards.json";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    const school = db.schools.find(s => s.id === params.id);
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    const nutritionStandardType = school.nutritionStandardType || "INMU_MAHIDOL";
    const customGrowthStandards = school.customGrowthStandards || null;
    const activeStandards = nutritionStandardType === "CUSTOM" && customGrowthStandards ? customGrowthStandards : defaultGrowthStandards;

    return NextResponse.json({
        schoolId: school.id,
        schoolName: school.name,
        nutritionStandardType,
        hasCustomStandards: !!customGrowthStandards,
        activeStandards,
        defaultGrowthStandards,
        customGrowthStandards,
    });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN" && role !== "SCHOOL_STAFF" && role !== "COMPANY_STAFF") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { nutritionStandardType, customGrowthStandards } = body;

    const db = readDb();
    const index = db.schools.findIndex(s => s.id === params.id);
    if (index === -1) return NextResponse.json({ error: "School not found" }, { status: 404 });

    db.schools[index] = {
        ...db.schools[index],
        nutritionStandardType: nutritionStandardType || db.schools[index].nutritionStandardType || "INMU_MAHIDOL",
        customGrowthStandards: customGrowthStandards !== undefined ? customGrowthStandards : db.schools[index].customGrowthStandards,
        updatedAt: new Date().toISOString(),
    };

    writeDb(db);

    return NextResponse.json({
        success: true,
        schoolId: params.id,
        nutritionStandardType: db.schools[index].nutritionStandardType,
        hasCustomStandards: !!db.schools[index].customGrowthStandards,
    });
}
