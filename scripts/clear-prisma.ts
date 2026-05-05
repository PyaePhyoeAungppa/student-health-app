import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️ Clearing database...");

    await prisma.healthRecord.deleteMany();
    console.log("✅ Health records deleted");
    
    await prisma.student.deleteMany();
    console.log("✅ Students deleted");
    
    // We might want to keep the users and schools if they want to keep logging in.
    // But usually "clear data" in these tests means everything except the base config.
    // I'll keep the Users for now so they don't lose access, unless they ask for a full reset.
    // Actually, usually it means everything.
    
    console.log("✨ Database cleared!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
