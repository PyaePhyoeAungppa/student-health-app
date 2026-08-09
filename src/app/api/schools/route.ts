import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = readDb();
    const sortedSchools = [...db.schools].sort((a, b) => a.name.localeCompare(b.name));
    
    const schoolsWithStats = sortedSchools.map(school => {
        const schoolStudents = db.students.filter(s => s.schoolId === school.id);
        const totalStudents = schoolStudents.length;
        let unparticipated = 0;

        schoolStudents.forEach(student => {
            const hrs = db.healthRecords.filter(h => h.studentId === student.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const hr = hrs[0];
            
            const noAge = student.age == null || student.age === "";
            const noWeight = !hr || hr.weight == null || hr.weight === "";
            const noHeight = !hr || hr.height == null || hr.height === "";

            if (noAge && noWeight && noHeight) {
                unparticipated++;
            }
        });

        const participated = totalStudents - unparticipated;

        return {
            ...school,
            stats: {
                total: totalStudents,
                unparticipated,
                participated
            }
        };
    });

    return NextResponse.json(schoolsWithStats);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "SYSTEM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const db = readDb();

    // Generate a 5-character numeric string
    let randomChars = '';
    const digits = '0123456789';
    for (let i = 0; i < 5; i++) {
        randomChars += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    const newSchool = {
        ...data,
        id: `school-${Date.now()}`,
        systemId: randomChars,
        testsConfig: data.testsConfig || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.schools.push(newSchool);
    writeDb(db);

    return NextResponse.json(newSchool, { status: 201 });
}
