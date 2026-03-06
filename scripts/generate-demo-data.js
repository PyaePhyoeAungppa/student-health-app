const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../src/data/db.json");

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const firstNames = ["สมพงษ์", "อภิรดี", "นที", "กานดา", "ธนพล", "สิรินทร์", "ภูมิ", "วรัญญา", "ชัยยุทธ", "ณัฐธิดา", "เกียรติศักดิ์", "อมรพรรณ", "ยงยุทธ", "กนกวรรณ", "พงศธร", "รัตนาภรณ์", "วีรพล", "จารุวรรณ", "อธิป", "ศศิธร"];
const lastNames = ["รุ่งเรือง", "เจริญวัฒนา", "ศรีสุข", "นิลพันธ์", "วงศ์ทอง", "แก้วมณี", "จันทร", "อินทร์สมบัติ", "ปัญญาสกุล", "ธรรมพิพัฒน์", "บุญส่ง", "ทองคำ", "พุ่มพวง", "ดีมาก", "สมบูรณ์"];
const provinces = ["Bangkok", "Chiang Mai", "Phuket", "Chonburi", "Nakhon Ratchasima"];
const bloodTypes = ["A", "B", "AB", "O"];
const classes = ["ม.1/1", "ม.1/2", "ม.2/1", "ม.2/2", "ม.3/1", "ม.3/2"];

function generateData() {
    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

    // Keep existing users
    const users = db.users;

    // Add 3 more schools
    const existingSchoolsCount = db.schools.length;
    for (let i = existingSchoolsCount + 1; i <= 5; i++) {
        const province = getRandomElement(provinces);
        db.schools.push({
            id: `school-${i}`,
            name: `โรงเรียน${province}นานาชาติ`,
            province: province,
            address: `${getRandomInt(1, 999)} ถนนสายไหม ${province} ${getRandomInt(10000, 99999)}`,
            createdAt: new Date().toISOString()
        });
    }

    const schools = db.schools;
    db.students = [];
    db.healthRecords = [];

    let studentCount = 1;
    let recordCount = 1;

    schools.forEach(school => {
        // Generate 15 students per school
        for (let i = 1; i <= 15; i++) {
            const gender = Math.random() > 0.5 ? "Male" : "Female";
            const studentId = `STU${String(studentCount).padStart(3, '0')}`;
            const sid = `stu-${studentCount}`;

            const dob = new Date();
            dob.setFullYear(2010 + getRandomInt(0, 3));
            dob.setMonth(getRandomInt(0, 11));
            dob.setDate(getRandomInt(1, 28));

            db.students.push({
                id: sid,
                studentId: studentId,
                firstName: getRandomElement(firstNames),
                surName: getRandomElement(lastNames),
                gender: gender,
                class: getRandomElement(classes),
                orderNumber: i,
                dob: dob.toISOString(),
                schoolId: school.id,
                createdAt: new Date().toISOString()
            });

            // Generate 2 health records per student (one for 2023, one for 2024)
            const weightBase = getRandomInt(35, 70);
            const heightBase = getRandomInt(140, 175);

            [2023, 2024].forEach(year => {
                const weight = weightBase + (year === 2024 ? getRandomInt(1, 5) : 0);
                const height = heightBase + (year === 2024 ? getRandomInt(1, 4) : 0);
                const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));

                const recordedAt = new Date(`${year}-${getRandomInt(1, 12).toString().padStart(2, '0')}-${getRandomInt(1, 28).toString().padStart(2, '0')}T09:00:00Z`);

                db.healthRecords.push({
                    id: `hr-${recordCount}`,
                    studentId: sid,
                    academicYear: year.toString(),
                    underlyingDisease: Math.random() > 0.9 ? "Asthma" : null,
                    drugAllergy: Math.random() > 0.95 ? "Penicillin" : null,
                    bloodType: getRandomElement(bloodTypes),
                    weight: weight,
                    height: height,
                    bmi: bmi,
                    hearingTest: Math.random() > 0.9 ? "ABNORMAL" : "NORMAL",
                    bodyExamination: "Normal",
                    visionPrescription: Math.random() > 0.8 ? `- ${getRandomInt(1, 4)}.00` : "20/20",
                    colorBlindness: Math.random() > 0.95 ? "ABNORMAL" : "NORMAL",
                    xRayResult: "Normal",
                    recordedAt: recordedAt.toISOString(),
                    createdAt: new Date().toISOString()
                });
                recordCount++;
            });
            studentCount++;
        }
    });

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    console.log(`✅ Generated ${db.schools.length} schools, ${db.students.length} students, and ${db.healthRecords.length} health records!`);
}

generateData();
