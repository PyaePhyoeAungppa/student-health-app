const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../db.json');

try {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  data.students = [];
  data.healthRecords = [];
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log("Students and health records cleared from db.json");
} catch (e) {
  console.error("Error clearing data:", e);
}
