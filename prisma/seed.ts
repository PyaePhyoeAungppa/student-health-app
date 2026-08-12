import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database from db.json data...");

    // Clean up
    await prisma.healthRecord.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    await prisma.school.deleteMany();

    // Create school
    const school = await prisma.school.create({
        data: {
            name: "สมุทรสาครวุฒิชัย",
            province: "สมุทรสาคร",
            address: "144/1 หมู่ 4 ต.บ้านเกาะ อ.เมืองสมุทรสาคร จ.สมุทรสาคร 74000",
        },
    });

    // Create users
    const adminHash = await bcrypt.hash("admin123", 10);
    const schoolHash = await bcrypt.hash("school123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);

    await prisma.user.create({
        data: {
            username: "admin",
            passwordHash: adminHash,
            role: "SYSTEM_ADMIN",
            fullName: "Admin User",
            email: "admin@gmail.com",
        },
    });

    await prisma.user.create({
        data: {
            username: "schooluser",
            passwordHash: schoolHash,
            role: "SCHOOL_STAFF",
            fullName: "School User",
            email: "school@gmail.com",
            schoolId: school.id,
        },
    });

    await prisma.user.create({
        data: {
            username: "company1",
            passwordHash: staffHash,
            role: "COMPANY_STAFF",
            fullName: "Company Staff",
            email: "staff@gmail.com",
        },
    });

    console.log("✅ Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
