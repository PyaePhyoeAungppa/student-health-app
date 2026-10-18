import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb } from "@/lib/db";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { getSchoolGrowthStandards, calculateZScoreAndClass, evaluateStudentGrowth } from "@/lib/growth-calculator";
import defaultGrowthStandards from "@/lib/growth-standards.json";

async function getChartImageBuffer(dataMap: Record<string, number>, title: string): Promise<Buffer | null> {
    const labels = Object.keys(dataMap).map(k => k || "Unknown");
    const data = Object.values(dataMap);
    if (data.length === 0) return null;
    
    const chart = {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ["#38bdf8", "#a78bfa", "#4ade80", "#fb923c", "#f43f5e", "#facc15", "#e879f9"]
            }]
        },
        options: {
            title: { display: true, text: title },
            plugins: { datalabels: { display: false } }
        }
    };
    
    const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chart))}&w=400&h=300&bkg=white`;
    try {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const format = searchParams.get("format");
    const role = (session.user as any).role;
    const userSchoolId = (session.user as any).schoolId;

    const effectiveSchoolId = role === "SCHOOL_STAFF" ? userSchoolId : schoolId;

    const db = readDb();

    let students = db.students;
    if (effectiveSchoolId) {
        students = students.filter(s => s.schoolId === effectiveSchoolId);
    }

    if (format === "xlsx") {
        const templatePath = path.join(process.cwd(), "พี่หยุย 66 Thaigrowth-KnownAge.xlsx");
        if (!fs.existsSync(templatePath)) {
            return new NextResponse("Template file not found.", { status: 404 });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        const dataSheet = workbook.getWorksheet("Data");
        
        if (!dataSheet) {
            return new NextResponse("Data sheet not found in template.", { status: 400 });
        }

        // Fill student data in Data sheet
        const studentReportRows: any[] = [];

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const excelRowNumber = 14 + i; // 1-based index, starts at 14 in template

            const latestRecord = db.healthRecords
                .filter(hr => hr.studentId === student.id)
                .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

            let ageInYears = student.age;
            let ageInMonths = 0;
            if (ageInYears !== undefined && ageInYears !== null) {
                ageInMonths = ageInYears * 12;
            } else if (student.dob) {
                const dobDate = new Date(student.dob);
                const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
                ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
                if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
                if (ageInMonths < 0) ageInMonths = 0;
                ageInYears = Math.floor(ageInMonths / 12);
            } else {
                ageInYears = 0;
                ageInMonths = 0;
            }

            const w = latestRecord?.weight || 0;
            const h = latestRecord?.height || 0;

            const isMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'MALE' || student.gender === 'ชาย' || student.prefix === 'ด.ช.' || student.prefix === 'เด็กชาย' || student.prefix === 'นาย';
            const gender = isMale ? 1 : 2;
            const name = `${student.prefix || ""} ${student.firstName || ""} ${student.surName || (student as any).lastName || ""}`.trim();

            const row = dataSheet.getRow(excelRowNumber);
            row.getCell(1).value = i + 1;
            row.getCell(2).value = name;
            row.getCell(3).value = gender;
            row.getCell(4).value = "";
            row.getCell(5).value = ageInYears;
            row.getCell(6).value = w;
            row.getCell(7).value = h;
            row.getCell(8).value = { formula: `IF(E${excelRowNumber}=0,999,1)`, result: 1 };
            row.getCell(9).value = { formula: `IF(H${excelRowNumber}=999,999,E${excelRowNumber}*12)`, result: ageInMonths };
            row.commit();

            // Calculate growth status for comprehensive sheet
            let waLabel = "—";
            let haLabel = "—";
            let whLabel = "—";

            const school = db.schools.find((s: any) => s.id === student.schoolId);
            const standards = getSchoolGrowthStandards(school);

            if (standards && w > 0 && h > 0) {
                const sexAge = gender * 1000 + Math.min(239, ageInMonths);
                const waRef = standards.waTable?.find((r: any) => r.sexAge === sexAge);
                if (waRef) waLabel = calculateZScoreAndClass(w, waRef.values, false, false).label;

                const haRef = standards.haTable?.find((r: any) => r.sexAge === sexAge);
                if (haRef) haLabel = calculateZScoreAndClass(h, haRef.values, true, false).label;

                const roundedHeight = Math.round(h * 4) / 4;
                const whRef = standards.whTable?.find((r: any) => r.height === roundedHeight);
                const whValues = whRef ? (gender === 1 ? whRef.maleValues : whRef.femaleValues) : null;
                if (whValues && !whValues.includes(NaN)) whLabel = calculateZScoreAndClass(w, whValues, false, true).label;
            }

            studentReportRows.push({
                "ลำดับ": i + 1,
                "รหัสนักเรียน": student.studentId || "",
                "คำนำหน้า": student.prefix || "",
                "ชื่อ": student.firstName || "",
                "นามสกุล": student.surName || (student as any).lastName || "",
                "ชื่อ-นามสกุล": name,
                "ชั้น/ห้อง": `${student.class || ""}${student.room ? "/" + student.room : ""}`,
                "เพศ": isMale ? "ชาย" : "หญิง",
                "อายุ (ปี)": ageInYears,
                "อายุ (เดือน)": ageInMonths,
                "น้ำหนัก (กก.)": w || "—",
                "ส่วนสูง (ซม.)": h || "—",
                "ดัชนีมวลกาย (BMI)": latestRecord?.bmi ?? "—",
                "น้ำหนักตามเกณฑ์อายุ (W/A)": waLabel,
                "ส่วนสูงตามเกณฑ์อายุ (H/A)": haLabel,
                "น้ำหนักตามเกณฑ์ส่วนสูง (W/H)": whLabel,
                "การได้ยิน": latestRecord?.hearingTest || "—",
                "การมองเห็นสี": latestRecord?.colorBlindness || "—",
                "กรุ๊ปเลือด": latestRecord?.bloodType || "—",
                "โรคประจำตัว": latestRecord?.underlyingDisease || "—",
                "แพ้ยา": latestRecord?.drugAllergy || "—",
                "วันที่ตรวจ": latestRecord?.recordedAt ? new Date(latestRecord.recordedAt).toLocaleDateString("th-TH") : "—"
            });
        }

        // Clear unused template rows in Data sheet
        for (let i = students.length; i < 2500; i++) {
            const excelRowNumber = 14 + i;
            const row = dataSheet.getRow(excelRowNumber);
            for (let c = 1; c <= 10; c++) {
                row.getCell(c).value = null;
            }
            row.commit();
        }

        // Add comprehensive Student Health Report sheet to workbook
        const reportWs = workbook.addWorksheet("รายงานสุขภาพและโภชนาการ");
        if (studentReportRows.length > 0) {
            const headerRow = Object.keys(studentReportRows[0]);
            reportWs.addRow(headerRow);
            for (const sr of studentReportRows) {
                const r = [];
                for (const h of headerRow) {
                    r.push(sr[h]);
                }
                reportWs.addRow(r);
            }
        }

        // Add Dashboard Charts
        const chartsWs = workbook.addWorksheet("Dashboard Charts");
        
        const studentIds = students.map(s => s.id);
        const healthRecords = db.healthRecords.filter((hr: any) => studentIds.includes(hr.studentId));
        const genderMap: Record<string, number> = {};
        const hearingMap: Record<string, number> = {};
        const colorBlindMap: Record<string, number> = {};
        const bloodTypeMap: Record<string, number> = {};

        students.forEach(s => {
            const genderLabel = s.gender || "Unknown";
            genderMap[genderLabel] = (genderMap[genderLabel] || 0) + 1;
        });
        healthRecords.forEach((hr: any) => {
            if (hr.hearingTest) hearingMap[hr.hearingTest] = (hearingMap[hr.hearingTest] || 0) + 1;
            if (hr.colorBlindness) colorBlindMap[hr.colorBlindness] = (colorBlindMap[hr.colorBlindness] || 0) + 1;
            if (hr.bloodType) bloodTypeMap[hr.bloodType] = (bloodTypeMap[hr.bloodType] || 0) + 1;
        });

        let colOffset = 0;
        const addImageToSheet = async (map: Record<string, number>, title: string) => {
            const buf = await getChartImageBuffer(map, title);
            if (buf) {
                const imgId = workbook.addImage({
                    buffer: buf as any,
                    extension: 'png',
                });
                chartsWs.addImage(imgId, {
                    tl: { col: colOffset, row: 1 },
                    ext: { width: 400, height: 300 }
                });
                colOffset += 7;
            }
        };

        await addImageToSheet(genderMap, "Gender Distribution");
        await addImageToSheet(hearingMap, "Hearing Test Results");
        await addImageToSheet(colorBlindMap, "Color Vision Results");
        await addImageToSheet(bloodTypeMap, "Blood Type Distribution");

        const xlsxBuffer = await workbook.xlsx.writeBuffer();

        const school = db.schools.find(s => s.id === effectiveSchoolId);
        // Strip non-ASCII chars so the header value stays a valid ByteString
        const schoolName = school
            ? school.name.replace(/\s+/g, "_").replace(/[^\x20-\x7E]/g, "") || "school"
            : "report";

        return new NextResponse(xlsxBuffer as any, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="growth-report-${schoolName}-${new Date().toISOString().slice(0, 10)}.xlsx"`
            }
        });
    }

    if (format === "csv") {
        const templatePath = path.join(process.cwd(), "พี่หยุย 66 Thaigrowth-KnownAge - NUSTA.csv");
        if (!fs.existsSync(templatePath)) {
            return new NextResponse("Template file not found.", { status: 404 });
        }

        const fileContent = fs.readFileSync(templatePath, "utf8");
        const workbook = XLSX.read(fileContent, { type: "string" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

        // Parse reference tables from the right side of the template starting at row 15 (index 14)
        const waTable: { sexAge: number; values: number[] }[] = [];
        const haTable: { sexAge: number; values: number[] }[] = [];
        const whTable: { height: number; maleValues: number[]; femaleValues: number[] }[] = [];

        for (let i = 14; i < rows.length; i++) {
            const cols = rows[i];
            if (!cols || cols.length < 100) continue;

            const waSexAge = cols[60] ? parseFloat(String(cols[60]).trim()) : null;
            if (waSexAge && waSexAge > 0) {
                waTable.push({
                    sexAge: waSexAge,
                    values: cols.slice(61, 70).map(v => parseFloat(String(v || "0").trim()))
                });
            }

            const haSexAge = cols[71] ? parseFloat(String(cols[71]).trim()) : null;
            if (haSexAge && haSexAge > 0) {
                haTable.push({
                    sexAge: haSexAge,
                    values: cols.slice(72, 81).map(v => parseFloat(String(v || "0").trim()))
                });
            }

            const whHt = cols[82] ? parseFloat(String(cols[82]).trim()) : null;
            if (whHt && whHt > 0) {
                whTable.push({
                    height: whHt,
                    maleValues: cols.slice(83, 92).map(v => parseFloat(String(v || "0").trim())),
                    femaleValues: cols.slice(92, 101).map(v => parseFloat(String(v || "0").trim()))
                });
            }
        }

        // Fill student data
        for (let i = 0; i < students.length; i++) {
            const student = students[i];

            // Find latest health record
            const latestRecord = db.healthRecords
                .filter(hr => hr.studentId === student.id)
                .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

            let ageInYears = student.age;
            let ageInMonths = 0;
            if (ageInYears !== undefined && ageInYears !== null) {
                ageInMonths = ageInYears * 12;
            } else if (student.dob) {
                const dobDate = new Date(student.dob);
                const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
                ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
                if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
                if (ageInMonths < 0) ageInMonths = 0;
                ageInYears = Math.floor(ageInMonths / 12);
            } else {
                ageInYears = 0;
                ageInMonths = 0;
            }

            const w = latestRecord?.weight;
            const h = latestRecord?.height;

            const isMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'MALE' || student.gender === 'ชาย' || student.prefix === 'ด.ช.' || student.prefix === 'เด็กชาย' || student.prefix === 'นาย';
            const gender = isMale ? 1 : 2;

            const sexAge = gender * 1000 + Math.min(239, ageInMonths);

            const waRef = waTable.find(r => r.sexAge === sexAge);
            const waRes = (w && waRef) ? calculateZScoreAndClass(w, waRef.values, false, false) : null;

            const haRef = haTable.find(r => r.sexAge === sexAge);
            const haRes = (h && haRef) ? calculateZScoreAndClass(h, haRef.values, true, false) : null;

            const roundedHeight = h ? Math.round(h * 4) / 4 : null;
            const whRef = roundedHeight ? whTable.find(r => r.height === roundedHeight) : null;
            const whValues = whRef ? (gender === 1 ? whRef.maleValues : whRef.femaleValues) : null;
            const whRes = (w && whValues && !whValues.includes(NaN)) ? calculateZScoreAndClass(w, whValues, false, true) : null;

            const rIndex = 14 + i;
            if (!rows[rIndex]) {
                rows[rIndex] = Array(120).fill("");
            }
            const studentRow = rows[rIndex];
            while (studentRow.length < 120) studentRow.push("");

            studentRow[0] = "";
            studentRow[1] = i + 1; // ลำดับ
            studentRow[2] = `${student.prefix || ""} ${student.firstName || ""} ${student.surName || (student as any).lastName || ""}`.trim(); // ชื่อ-นามสกุล
            studentRow[3] = gender; // เพศ
            studentRow[4] = ageInMonths; // อายุ (เดือน)
            studentRow[5] = ageInYears; // อายุ (ปี)
            studentRow[6] = w !== undefined && w !== null ? w : ""; // น้ำหนัก
            studentRow[7] = h !== undefined && h !== null ? h : ""; // ส่วนสูง

            // Weight-for-Age (W/A)
            studentRow[8] = waRes ? waRes.zScore : 999;
            studentRow[9] = waRes ? waRes.code : 0;
            studentRow[10] = "";
            studentRow[11] = waRes ? waRes.label : "";

            // Height-for-Age (H/A)
            studentRow[12] = haRes ? haRes.zScore : 999;
            studentRow[13] = haRes ? haRes.code : 0;
            studentRow[14] = "";
            studentRow[15] = haRes ? haRes.label : "";

            // Weight-for-Height (W/H)
            studentRow[16] = whRes ? whRes.zScore : 999;
            studentRow[17] = whRes ? whRes.code : 0;
            studentRow[18] = whRes ? whRes.label : "";

            studentRow[21] = "";
            studentRow[22] = sexAge;
            studentRow[23] = "";
            studentRow[24] = waRes ? waRes.zScore : 0;
            studentRow[25] = haRes ? haRes.zScore : 0;
            studentRow[26] = whRes ? whRes.zScore : 0;
            studentRow[27] = whRes ? whRes.zScore : 0;
            studentRow[28] = whRes ? whRes.zScore : 0;

            // Columns 29 to 34: W/A reference values
            if (waRef) {
                studentRow[29] = waRef.values[0];
                studentRow[30] = waRef.values[1];
                studentRow[31] = waRef.values[2];
                studentRow[32] = waRef.values[5];
                studentRow[33] = waRef.values[7];
                studentRow[34] = waRef.values[8];
            } else {
                studentRow[29] = 0; studentRow[30] = 0; studentRow[31] = 0;
                studentRow[32] = 0; studentRow[33] = 0; studentRow[34] = 0;
            }

            // Columns 35 to 40: H/A reference values
            if (haRef) {
                studentRow[35] = haRef.values[0];
                studentRow[36] = haRef.values[1];
                studentRow[37] = haRef.values[2];
                studentRow[38] = haRef.values[5];
                studentRow[39] = haRef.values[7];
                studentRow[40] = haRef.values[8];
            } else {
                studentRow[35] = 0; studentRow[36] = 0; studentRow[37] = 0;
                studentRow[38] = 0; studentRow[39] = 0; studentRow[40] = 0;
            }

            // Columns 41 to 46: W/H reference values
            if (whValues) {
                studentRow[41] = whValues[0];
                studentRow[42] = whValues[1];
                studentRow[43] = whValues[2];
                studentRow[44] = whValues[5];
                studentRow[45] = whValues[7];
                studentRow[46] = whValues[8];
            } else {
                studentRow[41] = 0; studentRow[42] = 0; studentRow[43] = 0;
                studentRow[44] = 0; studentRow[45] = 0; studentRow[46] = 0;
            }
        }

        // Clear unused template student rows beyond students.length
        const totalRowIndexNeeded = 14 + students.length;
        for (let i = totalRowIndexNeeded; i < rows.length; i++) {
            if (rows[i]) {
                for (let colIdx = 0; colIdx <= 58; colIdx++) {
                    rows[i][colIdx] = "";
                }
            }
        }

        const newSheet = XLSX.utils.aoa_to_sheet(rows);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");
        const csvBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "csv" });

        const school = db.schools.find(s => s.id === effectiveSchoolId);
        // Strip non-ASCII chars so the header value stays a valid ByteString
        const schoolName = school
            ? school.name.replace(/\s+/g, "_").replace(/[^\x20-\x7E]/g, "") || "school"
            : "report";

        const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
        const responseBuffer = Buffer.concat([bom, csvBuffer]);

        return new NextResponse(responseBuffer, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="growth-report-${schoolName}-${new Date().toISOString().slice(0, 10)}.csv"`
            }
        });
    }


    const studentIds = students.map(s => s.id);
    const healthRecords = db.healthRecords.filter(hr => studentIds.includes(hr.studentId));

    // Calculate distributions
    const genderMap: Record<string, number> = {};
    students.forEach(s => genderMap[s.gender] = (genderMap[s.gender] || 0) + 1);

    const hearingMap: Record<string, number> = {};
    const colorBlindMap: Record<string, number> = {};
    const bloodTypeMap: Record<string, number> = {};
    const bmis: number[] = [];

    healthRecords.forEach(hr => {
        if (hr.hearingTest) hearingMap[hr.hearingTest] = (hearingMap[hr.hearingTest] || 0) + 1;
        if (hr.colorBlindness) colorBlindMap[hr.colorBlindness] = (colorBlindMap[hr.colorBlindness] || 0) + 1;
        if (hr.bloodType) bloodTypeMap[hr.bloodType] = (bloodTypeMap[hr.bloodType] || 0) + 1;
        if (hr.bmi) bmis.push(hr.bmi);
    });

    const avgBmi = bmis.length ? parseFloat((bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1)) : 0;

    const studentGrowthData = students.map(student => {
        const latestRecord = db.healthRecords
            .filter(hr => hr.studentId === student.id)
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

        const school = db.schools.find(s => s.id === student.schoolId);
        const standards = getSchoolGrowthStandards(school);
        const growthEval = evaluateStudentGrowth(student, latestRecord, standards);

        let ageInYears = student.age;
        let ageInMonths = 0;
        if (ageInYears !== undefined && ageInYears !== null) {
            ageInMonths = ageInYears * 12;
        } else if (student.dob) {
            const dobDate = new Date(student.dob);
            const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
            ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
            if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
            if (ageInMonths < 0) ageInMonths = 0;
            ageInYears = Math.floor(ageInMonths / 12);
        } else {
            ageInYears = 0;
            ageInMonths = 0;
        }

        const w = latestRecord?.weight;
        const h = latestRecord?.height;
        const isMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'MALE' || student.gender === 'ชาย' ||
            student.prefix === 'ด.ช.' || student.prefix === 'เด็กชาย' || student.prefix === 'นาย';

        return {
            id: student.id,
            studentId: student.studentId,
            name: `${student.prefix || ""} ${student.firstName} ${student.surName}`.trim(),
            class: `${student.class || ""}${student.room ? "/" + student.room : ""}`,
            gender: isMale ? "Male" : "Female",
            ageMonths: ageInMonths,
            ageYears: ageInYears,
            weight: w !== undefined && w !== null ? w : "—",
            height: h !== undefined && h !== null ? h : "—",
            bmi: latestRecord?.bmi !== undefined && latestRecord?.bmi !== null ? latestRecord.bmi : null,
            waZScore: growthEval.waZScore,
            waLabel: growthEval.waLabel,
            haZScore: growthEval.haZScore,
            haLabel: growthEval.haLabel,
            whZScore: growthEval.whZScore,
            whLabel: growthEval.whLabel,
        };
    });

    return NextResponse.json({
        totalStudents: students.length,
        totalRecords: healthRecords.length,
        avgBmi,
        bmiDistribution: {
            underweight: bmis.filter(b => b < 18.5).length,
            normal: bmis.filter(b => b >= 18.5 && b < 25).length,
            overweight: bmis.filter(b => b >= 25 && b < 30).length,
            obese: bmis.filter(b => b >= 30).length,
        },
        hearingStats: Object.keys(hearingMap).map(k => ({ hearingTest: k, _count: hearingMap[k] })),
        colorBlindStats: Object.keys(colorBlindMap).map(k => ({ colorBlindness: k, _count: colorBlindMap[k] })),
        bloodTypeStats: Object.keys(bloodTypeMap).map(k => ({ bloodType: k, _count: bloodTypeMap[k] })),
        genderStats: Object.keys(genderMap).map(k => ({ gender: k, _count: genderMap[k] })),
        studentGrowthData,
    });
}
