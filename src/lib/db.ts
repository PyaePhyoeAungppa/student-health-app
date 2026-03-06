import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");
console.log(`[DB-DEBUG] Database path: ${DB_PATH}`);

export interface Database {
    schools: any[];
    users: any[];
    students: any[];
    healthRecords: any[];
}

export function readDb(): Database {
    if (!fs.existsSync(DB_PATH)) {
        return { schools: [], users: [], students: [], healthRecords: [] };
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
}

export function writeDb(data: Database) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}
