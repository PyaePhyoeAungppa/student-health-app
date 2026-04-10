const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../db.json');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const schools = [
  { id: 'school-1', name: 'โรงเรียนบางกอกพิทยา' },
  { id: 'school-5', name: 'โรงเรียนChonburiนานาชาติ' },
];

const maleFirstNames = ['สมชาย','ประเสริฐ','วิชัย','ธนกร','อนุชา','ปิยะ','ภูมิ','นพดล','กิตติ','รัตนชัย','วรวุฒิ','ณัฐพล','พีรพัฒน์','เจษฎา','สุรชัย'];
const femaleFirstNames = ['สมหญิง','นภา','พิมพ์ใจ','วรรณา','อัจฉรา','สุดา','ณัฐิดา','กนกวรรณ','ปิยาภรณ์','มัลลิกา','ชลิตา','วิภาวี','สุภาพร','นลินี','ภัทรา'];
const lastNames = ['ใจดี','สุขสม','มีทรัพย์','ดีมาก','สว่างใจ','พึ่งบุญ','รักเรียน','ดีจริง','มณีรัตน์','ทองดี','วงศ์สุข','บุญมา','ศรีสุข','เจริญสุข','พงษ์ศิริ'];
const classes = ['ม.1/1','ม.1/2','ม.2/1','ม.2/2','ม.3/1','ม.3/2','ม.4/1','ม.4/2','ม.5/1','ม.6/1'];
const bloodTypes = ['A','B','AB','O','UNKNOWN'];
const hearingOptions = ['NORMAL','NORMAL','NORMAL','ABNORMAL'];
const colorOptions = ['NORMAL','NORMAL','NORMAL','NORMAL','ABNORMAL'];
const thaiIds = [
  '1100100000001','1100100000002','1100100000003','1100100000004','1100100000005',
  '1100100000006','1100100000007','1100100000008','1100100000009','1100100000010',
  '1100100000011','1100100000012','1100100000013','1100100000014','1100100000015',
  '1100100000016','1100100000017','1100100000018','1100100000019','1100100000020',
  '1100100000021','1100100000022','1100100000023','1100100000024','1100100000025',
  '1100100000026','1100100000027','1100100000028','1100100000029','1100100000030',
  '1100100000031','1100100000032','1100100000033','1100100000034','1100100000035',
  '1100100000036','1100100000037','1100100000038','1100100000039','1100100000040',
  '1100100000041','1100100000042','1100100000043','1100100000044','1100100000045',
  '1100100000046','1100100000047','1100100000048','1100100000049','1100100000050',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return +(min + Math.random() * (max - min)).toFixed(1); }

// Clear existing students and health records
db.students = [];
db.healthRecords = [];

const now = new Date();

for (let i = 0; i < 50; i++) {
  const isMale = i % 3 !== 0; // roughly 2/3 male, 1/3 female for variety
  const gender = isMale ? 'Male' : 'Female';
  const firstName = isMale ? pick(maleFirstNames) : pick(femaleFirstNames);
  const surName = pick(lastNames);
  const school = i < 30 ? schools[0] : schools[1];
  const cls = pick(classes);
  const orderNum = (i % 40) + 1;

  // DOB: ages 12-18 => year 2006-2013 using Buddhist era to Gregorian
  const birthYear = 2007 + Math.floor(Math.random() * 7); // 2007-2013
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const dob = new Date(`${birthYear}-${birthMonth}-${birthDay}`).toISOString();

  const studentId = `STU${String(i + 1).padStart(3, '0')}`;
  const thaiId = thaiIds[i];

  const stuId = `stu-seed-${i + 1}`;
  db.students.push({
    id: stuId,
    studentId,
    thaiId,
    orderNumber: orderNum,
    class: cls,
    gender,
    prefix: isMale ? 'ด.ช.' : 'ด.ญ.',
    firstName,
    surName,
    dob,
    age: now.getFullYear() - birthYear,
    schoolId: school.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Health record with variety
  const height = rand(140, 175);
  const weight = rand(35, 80);
  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
  const hearing = pick(hearingOptions);
  const color = pick(colorOptions);

  // Some students have no health records
  if (i % 7 !== 6) {
    db.healthRecords.push({
      id: `hr-seed-${i + 1}`,
      studentId: stuId,
      academicYear: '2567',
      recordedAt: now.toISOString(),
      bloodType: pick(bloodTypes),
      weight,
      height,
      bmi,
      hearingTest: hearing,
      colorBlindness: color,
      visionPrescription: i % 5 === 0 ? '20/40' : '20/20',
      underlyingDisease: i % 8 === 0 ? 'โรคหอบหืด' : null,
      drugAllergy: i % 10 === 0 ? 'ยาเพนิซิลิน' : null,
      xRayResult: i % 12 === 0 ? 'พบความผิดปกติ' : null,
      weightByAge: bmi < 18.5 ? 'ต่ำกว่าเกณฑ์' : bmi < 25 ? 'ปกติ' : bmi < 30 ? 'สูงกว่าเกณฑ์' : 'อ้วน',
      createdAt: now.toISOString(),
    });
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`✅ Seeded ${db.students.length} students and ${db.healthRecords.length} health records.`);
console.log(`   School 1 (บางกอก): ${db.students.filter(s=>s.schoolId==='school-1').length} students`);
console.log(`   School 5 (ชลบุรี): ${db.students.filter(s=>s.schoolId==='school-5').length} students`);
console.log(`   Male: ${db.students.filter(s=>s.gender==='Male').length}, Female: ${db.students.filter(s=>s.gender==='Female').length}`);
