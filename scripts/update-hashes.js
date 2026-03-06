const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../src/data/db.json");

async function updateDb() {
    const adminHash = await bcrypt.hash("admin123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);
    const schoolHash = await bcrypt.hash("school123", 10);

    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

    db.users = [
        {
            "id": "user-admin",
            "username": "admin",
            "passwordHash": adminHash,
            "role": "SYSTEM_ADMIN",
            "fullName": "System Administrator",
            "email": "admin@healthsystem.th",
            "createdAt": new Date().toISOString()
        },
        {
            "id": "user-company",
            "username": "company1",
            "passwordHash": staffHash,
            "role": "COMPANY_STAFF",
            "fullName": "บริษัท เจ้าหน้าที่ ข้อมูล",
            "email": "staff@healthsystem.th",
            "createdAt": new Date().toISOString()
        },
        {
            "id": "user-school",
            "username": "school1",
            "passwordHash": schoolHash,
            "role": "SCHOOL_STAFF",
            "fullName": "ครู สมจิตร",
            "email": "teacher@bangkokschool.th",
            "schoolId": "school-1",
            "createdAt": new Date().toISOString()
        }
    ];

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    console.log("✅ db.json updated with real bcrypt hashes!");
}

updateDb();
