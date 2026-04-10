const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.students = [];
db.healthRecords = [];

const schoolId = 'school-1';
const genders = ['MALE', 'FEMALE'];

const firstNamesMale = ["สมชาย", "ชาติชาย", "วีระ", "วิชัย", "กฤษณะ", "พงศ์พานิช", "ประเสริฐ", "นพดล", "ศักดิ์ชัย", "ธนพล", "นราวุธ", "เจษฎา", "ทวีศักดิ์", "ศุภโชค", "นพพล"];
const firstNamesFemale = ["สมหญิง", "กมลชนก", "พรพิมล", "กฤษณา", "พัชรี", "สุจิตรา", "นันทนา", "ศิริพร", "รัตนา", "อัญชลี", "มณีรัตน์", "สุนิสา", "สุทธิดา", "ดารณี", "พรรณี"];
const lastNames = ["มีสุข", "ดีงาม", "มั่นคง", "ใจดี", "เพชรงาม", "ทองหล่อ", "บริบูรณ์", "รักเรียน", "นิลวรรณ", "เจริญชัย", "สิงหราช", "โพธิ์ทอง", "ศรีสุข", "รุ่งโรจน์", "วิเศษกุล"];

const classes = ["P.1/1", "P.2/1", "P.3/1", "P.4/1", "P.5/1", "P.6/1", "M.1/1", "M.2/1", "M.3/1"];

for (let i = 1; i <= 20; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const firstNameList = gender === 'MALE' ? firstNamesMale : firstNamesFemale;
    const firstName = firstNameList[Math.floor(Math.random() * firstNameList.length)];
    const surName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const age = Math.floor(Math.random() * (15 - 7 + 1)) + 7;
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    dob.setMonth(Math.floor(Math.random() * 12));
    dob.setDate(Math.floor(Math.random() * 28));

    const studentIdStr = "STU" + i.toString().padStart(3, '0');
    const studentDbId = "stu-" + Date.now() + "-" + Math.floor(Math.random()*1000);

    const student = {
        id: studentDbId,
        studentId: studentIdStr,
        firstName,
        surName,
        dob: dob.toISOString(),
        gender,
        class: classes[Math.floor(Math.random() * classes.length)],
        schoolId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.students.push(student);

    const height = Math.floor(Math.random() * (170 - 110 + 1)) + 110;
    const weight = Math.floor(Math.random() * (70 - 25 + 1)) + 25;
    const bmi = +(weight / ((height / 100) * (height / 100))).toFixed(1);

    const record = {
        id: "hr-" + Date.now() + "-" + Math.floor(Math.random()*1000) + i,
        studentId: studentDbId,
        schoolId,
        academicYear: 2024,
        weight,
        height,
        bmi,
        bloodType: ['A', 'B', 'AB', 'O'][Math.floor(Math.random()*4)],
        visionPrescription: Math.random() > 0.8 ? "Left -1.00" : "NORMAL",
        underlyingDisease: Math.random() > 0.8 ? "Asthma" : "NORMAL",
        drugAllergy: Math.random() > 0.9 ? "Paracetamol" : "NORMAL",
        hearingTest: Math.random() > 0.9 ? "ABNORMAL" : "NORMAL",
        colorBlindness: Math.random() > 0.9 ? "ABNORMAL" : "NORMAL",
        xRayResult: "NORMAL",
        recordedAt: new Date().toISOString(),
        recordedBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.healthRecords.push(record);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log("Generated 20 students and their health records under school-1.");
