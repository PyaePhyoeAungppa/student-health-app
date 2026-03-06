const bcrypt = require("bcryptjs");

async function generateHashes() {
    const adminHash = await bcrypt.hash("admin123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);
    const schoolHash = await bcrypt.hash("school123", 10);

    console.log("Admin Hash (admin123):", adminHash);
    console.log("Staff Hash (staff123):", staffHash);
    console.log("School Hash (school123):", schoolHash);
}

generateHashes();
