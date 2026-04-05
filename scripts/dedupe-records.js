const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');

let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const recordMap = new Map();
let originalCount = db.healthRecords.length;

const currentYear = new Date().getFullYear().toString();

for (let i = 0; i < db.healthRecords.length; i++) {
    // Backfill missing academic year
    if (!db.healthRecords[i].academicYear) {
        db.healthRecords[i].academicYear = currentYear;
    }
}

// Keep only the most recent record per studentId + academicYear
for (const record of db.healthRecords) {
    const key = `${record.studentId}-${record.academicYear}`;
    if (!recordMap.has(key)) {
        recordMap.set(key, record);
    } else {
        // If it exists, check which one has more actual data (not completely empty strings)
        // OR simply prefer the one with a higher ID timestamp (which means it's newer) 
        // Wait, if the newer one is the "empty" one the user just created, we should KEEP the older one's data
        // and just update it!
        const existing = recordMap.get(key);
        
        // Merge the two! If the new record has empty/null values, keep the existing populated values!
        const merged = { ...existing };
        for (const [k, v] of Object.entries(record)) {
            // Overwrite if new value is more meaningful 
            if (v !== null && v !== "" && v !== undefined && v !== "UNKNOWN" && v !== "NORMAL") {
                merged[k] = v;
            }
        }
        // Force the ID/recordedAt of the newer one if we want
        merged.updatedAt = new Date().toISOString();
        
        recordMap.set(key, merged);
    }
}

db.healthRecords = Array.from(recordMap.values());
const newCount = db.healthRecords.length;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log(`Backfilled academicYear and deduplicated health records from ${originalCount} down to ${newCount}.`);
