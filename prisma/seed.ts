import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clean up
    await prisma.healthRecord.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    await prisma.school.deleteMany();

    // Create schools
    const school1 = await prisma.school.create({
        data: {
            name: "โรงเรียนบางกอกพิทยา",
            province: "Bangkok",
            address: "123 สุขุมวิท กรุงเทพฯ 10110",
        },
    });
    const school2 = await prisma.school.create({
        data: {
            name: "โรงเรียนเชียงใหม่วิทยา",
            province: "Chiang Mai",
            address: "456 นิมมานเหมินทร์ เชียงใหม่ 50200",
        },
    });

    // Create users
    const adminHash = await bcrypt.hash("admin123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);
    const schoolHash = await bcrypt.hash("school123", 10);

    await prisma.user.create({
        data: {
            username: "admin",
            passwordHash: adminHash,
            role: "SYSTEM_ADMIN",
            fullName: "System Administrator",
            email: "admin@healthsystem.th",
        },
    });

    await prisma.user.create({
        data: {
            username: "company_staff",
            passwordHash: staffHash,
            role: "COMPANY_STAFF",
            fullName: "บริษัท เจ้าหน้าที่ ข้อมูล",
            email: "staff@healthsystem.th",
        },
    });

    await prisma.user.create({
        data: {
            username: "school_staff",
            passwordHash: schoolHash,
            role: "SCHOOL_STAFF",
            fullName: "ครู สมจิตร",
            email: "teacher@bangkokschool.th",
            schoolId: school1.id,
        },
    });

    // Create students
    const students = [
        { studentId: "STU001", firstName: "สมชาย", surName: "ใจดี", gender: "Male", class: "ม.1/1", orderNumber: 1, dob: new Date("2012-03-15") },
        { studentId: "STU002", firstName: "สมหญิง", surName: "รักเรียน", gender: "Female", class: "ม.1/1", orderNumber: 2, dob: new Date("2012-07-22") },
        { studentId: "STU003", firstName: "ประยุทธ", surName: "สมใจ", gender: "Male", class: "ม.1/2", orderNumber: 1, dob: new Date("2011-11-05") },
        { studentId: "STU004", firstName: "มาลี", surName: "ดอกไม้", gender: "Female", class: "ม.2/1", orderNumber: 2, dob: new Date("2011-01-18") },
        { studentId: "STU005", firstName: "วิชัย", surName: "ขยันเรียน", gender: "Male", class: "ม.2/2", orderNumber: 3, dob: new Date("2010-05-30") },
    ];

    for (const s of students) {
        const student = await prisma.student.create({
            data: { ...s, schoolId: school1.id },
        });

        const w = 40 + Math.random() * 30;
        const h = 140 + Math.random() * 30;
        const bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(1));

        await prisma.healthRecord.create({
            data: {
                studentId: student.id,
                academicYear: "2024",
                underlyingDisease: Math.random() > 0.7 ? "โรคหอบหืด" : null,
                drugAllergy: Math.random() > 0.8 ? "Penicillin" : null,
                bloodType: ["A", "B", "AB", "O"][Math.floor(Math.random() * 4)],
                weight: parseFloat(w.toFixed(1)),
                height: parseFloat(h.toFixed(1)),
                bmi,
                hearingTest: Math.random() > 0.9 ? "ABNORMAL" : "NORMAL",
                bodyExamination: "ปกติ",
                visionPrescription: Math.random() > 0.7 ? "-1.50" : "20/20",
                colorBlindness: Math.random() > 0.95 ? "ABNORMAL" : "NORMAL",
                xRayResult: "ปกติ",
            },
        });
    }

    // School 2 student
    const stu6 = await prisma.student.create({
        data: {
            studentId: "STU006",
            firstName: "อรุณ",
            surName: "เชียงใหม่",
            gender: "Male",
            class: "ป.6",
            orderNumber: 1,
            dob: new Date("2012-09-10"),
            schoolId: school2.id,
        },
    });

    await prisma.healthRecord.create({
        data: {
            studentId: stu6.id,
            academicYear: "2024",
            bloodType: "O",
            weight: 38.5,
            height: 145.0,
            bmi: 18.3,
            hearingTest: "NORMAL",
            bodyExamination: "ปกติ",
            visionPrescription: "20/20",
            colorBlindness: "NORMAL",
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
