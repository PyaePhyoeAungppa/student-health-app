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

export function readDb(): Database {
    if (!fs.existsSync(DB_PATH)) {
        return { schools: [], users: [], students: [], healthRecords: [], settings: { ageValidations: [] } };
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    if (!db.settings) db.settings = { ageValidations: [] };
    if (!db.settings.ageValidations) db.settings.ageValidations = [];
    return db;
}

export function writeDb(data: Database) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}
