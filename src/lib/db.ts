import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");
console.log(`[DB-DEBUG] Database path: ${DB_PATH}`);

export interface Database {
    schools: any[];
    users: any[];
    students: any[];
    healthRecords: any[];
    settings?: {
        ageValidations: {
            id: string;
            age: number;
            minWeight: number;
            maxWeight: number;
            minHeight: number;
            maxHeight: number;
        }[];
    };
}

let memoryDb: Database | null = null;

const defaultSeedData: Database = {
    schools: [
        {
            id: "school-1784702755472",
            name: "สมุทรสาครวุฒิชัย",
            province: "สมุทรสาคร",
            address: "144/1 หมู่ 4 ต.บ้านเกาะ อ.เมืองสมุทรสาคร จ.สมุทรสาคร 74000",
            testsConfig: {
                bloodType: true,
                tenSteps: true,
                symptoms: true,
                hearingTest: true,
                colorBlindness: true,
                eyeTest: true,
                visionBothEyes: true,
                flexibility: true,
                handgripStrength: true,
                standingKneeRaises: false,
                situps: false,
                pushups: false,
                xRayResult: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ],
    users: [
        {
            id: "user-admin",
            username: "admin",
            passwordHash: "$2b$10$6qemCqwgdWpOeyAlg7jUSeiKuHiYbaz3y50JAilgN.l0suTKILjqC", // admin123
            role: "SYSTEM_ADMIN",
            fullName: "Admin User",
            email: "admin@gmail.com",
            language: "th",
            createdAt: new Date().toISOString(),
        },
        {
            id: "user-1780077172974",
            username: "schooluser",
            passwordHash: "$2b$10$o.JoxRXn28AzZXmbep/hX.sYWebUHzOOc6Z6sD12v6qVI3VPBCOO6", // school123
            role: "SCHOOL_STAFF",
            fullName: "School User",
            email: "school@gmail.com",
            schoolId: "school-1784702755472",
            createdAt: new Date().toISOString(),
        },
        {
            id: "user-1780078101553",
            username: "company1",
            passwordHash: "$2b$10$IttQkM0hkBxv/xSgPZHldujI5DADR2oQlxp.hfhoXq3Qn4WgSPxca", // staff123
            role: "COMPANY_STAFF",
            fullName: "Company Staff",
            email: "staff@gmail.com",
            schoolId: "",
            createdAt: new Date().toISOString(),
        }
    ],
    students: [],
    healthRecords: [],
    settings: { ageValidations: [] }
};

export function readDb(): Database {
    if (memoryDb) {
        return memoryDb;
    }
    try {
        if (!fs.existsSync(DB_PATH)) {
            memoryDb = JSON.parse(JSON.stringify(defaultSeedData));
            writeDb(memoryDb!);
            return memoryDb!;
        }
        const data = fs.readFileSync(DB_PATH, "utf-8");
        const db = JSON.parse(data);
        if (!db.schools) db.schools = [];
        if (!db.users) db.users = [];
        if (!db.students) db.students = [];
        if (!db.healthRecords) db.healthRecords = [];
        if (!db.settings) db.settings = { ageValidations: [] };
        if (!db.settings.ageValidations) db.settings.ageValidations = [];
        memoryDb = db;
        return memoryDb!;
    } catch (err) {
        console.error("[DB-DEBUG] Failed to read DB file, using fallback:", err);
        memoryDb = JSON.parse(JSON.stringify(defaultSeedData));
        return memoryDb!;
    }
}

export function writeDb(data: Database) {
    memoryDb = data;
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.error("[DB-ERROR] Write DB failed:", err);
    }
}
