import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb } from "@/lib/db";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

// Helper functions for Z-score and SD classification
function calculateZScoreAndClass(val: number, refValues: number[], isHeight: boolean, isWeightForHeight: boolean) {
    const [sd3n, sd2n, sd1_5n, sd1n, median, sd1p, sd1_5p, sd2p, sd3p] = refValues;

    let code = 4;
    let label = "";

    if (isHeight) {
        if (val < sd3n) {
            code = 1;
            label = "เตี้ยมาก";
        } else if (val < sd2n) {
            code = 2;
            label = "เตี้ย";
        } else if (val < sd1_5n) {
            code = 3;
            label = "ค่อนข้างเตี้ย";
        } else if (val <= sd1_5p) {
            code = 4;
            label = "ส่วนสูงตามเกณฑ์";
        } else if (val <= sd2p) {
            code = 5;
            label = "ค่อนข้างสูง";
        } else {
            code = 6;
            label = "สูงกว่าเกณฑ์";
        }
    } else if (isWeightForHeight) {
        if (val < sd3n) {
            code = 1;
            label = "ผอมมาก";
        } else if (val < sd2n) {
            code = 2;
            label = "ผอม";
        } else if (val < sd1_5n) {
            code = 3;
            label = "ค่อนข้างผอม";
        } else if (val <= sd1_5p) {
            code = 4;
            label = "สมส่วน";
        } else if (val <= sd2p) {
            code = 5;
            label = "ท้วม";
        } else if (val <= sd3p) {
            code = 6;
            label = "เริ่มอ้วน";
        } else {
            code = 7;
            label = "อ้วน";
        }
    } else {
        // Weight-for-Age
        if (val < sd3n) {
            code = 1;
            label = "น้ำหนักน้อยกว่าเกณฑ์มาก";
        } else if (val < sd2n) {
            code = 2;
            label = "น้ำหนักน้อยกว่าเกณฑ์";
        } else if (val < sd1_5n) {
            code = 3;
            label = "น้ำหนักค่อนข้างน้อย";
        } else if (val <= sd1_5p) {
            code = 4;
            label = "น้ำหนักตามเกณฑ์";
        } else if (val <= sd2p) {
            code = 5;
            label = "น้ำหนักค่อนข้างมาก";
        } else if (val <= sd3p) {
            code = 6;
            label = "น้ำหนักมากกว่าเกณฑ์";
        } else {
            code = 7;
            label = "น้ำหนักมากกว่าเกณฑ์มาก";
        }
    }

    let zScore = 0;
    if (val === median) {
        zScore = 0;
    } else if (val > median) {
        if (val <= sd1p) {
            zScore = (val - median) / (sd1p - median);
        } else if (val <= sd1_5p) {
            zScore = 1 + 0.5 * (val - sd1p) / (sd1_5p - sd1p);
        } else if (val <= sd2p) {
            zScore = 1.5 + 0.5 * (val - sd1_5p) / (sd2p - sd1_5p);
        } else if (val <= sd3p) {
            zScore = 2 + (val - sd2p) / (sd3p - sd2p);
        } else {
            zScore = 3 + (val - sd3p) / (sd3p - sd2p);
        }
    } else {
        if (val >= sd1n) {
            zScore = -((median - val) / (median - sd1n));
        } else if (val >= sd1_5n) {
            zScore = -1 - 0.5 * (sd1n - val) / (sd1n - sd1_5n);
        } else if (val >= sd2n) {
            zScore = -1.5 - 0.5 * (sd1_5n - val) / (sd1_5n - sd2n);
        } else if (val >= sd3n) {
            zScore = -2 - (sd2n - val) / (sd2n - sd3n);
        } else {
            zScore = -3 - (sd3n - val) / (sd2n - sd3n);
        }
    }

    return {
        zScore: parseFloat(zScore.toFixed(2)),
        code,
        label
    };
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

        const fileBuffer = fs.readFileSync(templatePath);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const dataSheet = workbook.Sheets["Data"];
        if (!dataSheet) {
            return new NextResponse("Data sheet not found in template.", { status: 400 });
        }

        // Fill student data
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const rIdx = 13 + i;
            const excelRowNumber = rIdx + 1;

            const latestRecord = db.healthRecords
                .filter(hr => hr.studentId === student.id)
                .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

            const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
            const dobDate = new Date(student.dob);

            let ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
            if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
            if (ageInMonths < 0) ageInMonths = 0;
            const ageInYears = Math.floor(ageInMonths / 12);

            const w = latestRecord?.weight || 0;
            const h = latestRecord?.height || 0;

            const isMale = student.gender === 'Male' || student.gender === 'male' || student.prefix === 'ด.ช.' || student.prefix === 'นาย';
            const gender = isMale ? 1 : 2;
            const name = `${student.prefix || ""} ${student.firstName} ${student.surName}`.trim();

            const cellA = XLSX.utils.encode_cell({ r: rIdx, c: 0 });
            const cellB = XLSX.utils.encode_cell({ r: rIdx, c: 1 });
            const cellC = XLSX.utils.encode_cell({ r: rIdx, c: 2 });
            const cellD = XLSX.utils.encode_cell({ r: rIdx, c: 3 });
            const cellE = XLSX.utils.encode_cell({ r: rIdx, c: 4 });
            const cellF = XLSX.utils.encode_cell({ r: rIdx, c: 5 });
            const cellG = XLSX.utils.encode_cell({ r: rIdx, c: 6 });
            const cellH = XLSX.utils.encode_cell({ r: rIdx, c: 7 });
            const cellI = XLSX.utils.encode_cell({ r: rIdx, c: 8 });

            dataSheet[cellA] = { t: 'n', v: i + 1 };
            dataSheet[cellB] = { t: 's', v: name };
            dataSheet[cellC] = { t: 'n', v: gender };
            dataSheet[cellD] = { t: 's', v: "" };
            dataSheet[cellE] = { t: 'n', v: ageInYears };
            dataSheet[cellF] = { t: 'n', v: w };
            dataSheet[cellG] = { t: 'n', v: h };
            dataSheet[cellH] = { t: 'n', v: 1, f: `IF(E${excelRowNumber}=0,999,1)` };
            dataSheet[cellI] = { t: 'n', v: ageInMonths, f: `IF(H${excelRowNumber}=999,999,E${excelRowNumber}*12)` };
        }

        // Clear remaining unused rows in Data sheet (index 13 + students.length to 2500)
        for (let i = students.length; i < 2500; i++) {
            const rIdx = 13 + i;
            for (let c = 0; c < 10; c++) {
                const cellRef = XLSX.utils.encode_cell({ r: rIdx, c });
                delete dataSheet[cellRef];
            }
        }

        const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        const school = db.schools.find(s => s.id === effectiveSchoolId);
        const schoolName = school ? school.name.replace(/\s+/g, "_") : "report";

        return new NextResponse(xlsxBuffer, {
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

            const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
            const dobDate = new Date(student.dob);

            let ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
            if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
            if (ageInMonths < 0) ageInMonths = 0;
            const ageInYears = Math.floor(ageInMonths / 12);

            const w = latestRecord?.weight;
            const h = latestRecord?.height;

            const isMale = student.gender === 'Male' || student.gender === 'male' || student.prefix === 'ด.ช.' || student.prefix === 'นาย';
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
            studentRow[2] = `${student.prefix || ""} ${student.firstName} ${student.surName}`.trim(); // ชื่อ-นามสกุล
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

        // Clear unused template student rows (index students.length to 999)
        for (let i = students.length; i < 1000; i++) {
            const rIndex = 14 + i;
            if (rows[rIndex]) {
                for (let colIdx = 0; colIdx <= 58; colIdx++) {
                    rows[rIndex][colIdx] = "";
                }
            }
        }

        const newSheet = XLSX.utils.aoa_to_sheet(rows);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");
        const csvBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "csv" });

        const school = db.schools.find(s => s.id === effectiveSchoolId);
        const schoolName = school ? school.name.replace(/\s+/g, "_") : "report";

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

    // Load template to parse standards for the table view
    const templatePath = path.join(process.cwd(), "พี่หยุย 66 Thaigrowth-KnownAge - NUSTA.csv");
    let parsedStandards = null;
    if (fs.existsSync(templatePath)) {
        const fileContent = fs.readFileSync(templatePath, "utf8");
        const workbook = XLSX.read(fileContent, { type: "string" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

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
        parsedStandards = { waTable, haTable, whTable };
    }

    const studentGrowthData = students.map(student => {
        const latestRecord = db.healthRecords
            .filter(hr => hr.studentId === student.id)
            .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

        const checkupDate = latestRecord ? new Date(latestRecord.recordedAt) : new Date();
        const dobDate = new Date(student.dob);

        let ageInMonths = (checkupDate.getFullYear() - dobDate.getFullYear()) * 12 + (checkupDate.getMonth() - dobDate.getMonth());
        if (checkupDate.getDate() < dobDate.getDate()) ageInMonths--;
        if (ageInMonths < 0) ageInMonths = 0;
        const ageInYears = Math.floor(ageInMonths / 12);

        const w = latestRecord?.weight;
        const h = latestRecord?.height;

        const isMale = student.gender === 'Male' || student.gender === 'male' || student.prefix === 'ด.ช.' || student.prefix === 'นาย';
        const gender = isMale ? 1 : 2;

        let waRes = null;
        let haRes = null;
        let whRes = null;

        if (parsedStandards && w && h) {
            const sexAge = gender * 1000 + Math.min(239, ageInMonths);
            const waRef = parsedStandards.waTable.find(r => r.sexAge === sexAge);
            if (waRef) waRes = calculateZScoreAndClass(w, waRef.values, false, false);

            const haRef = parsedStandards.haTable.find(r => r.sexAge === sexAge);
            if (haRef) haRes = calculateZScoreAndClass(h, haRef.values, true, false);

            const roundedHeight = Math.round(h * 4) / 4;
            const whRef = parsedStandards.whTable.find(r => r.height === roundedHeight);
            const whValues = whRef ? (gender === 1 ? whRef.maleValues : whRef.femaleValues) : null;
            if (whValues && !whValues.includes(NaN)) whRes = calculateZScoreAndClass(w, whValues, false, true);
        }

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
            waZScore: waRes ? waRes.zScore : "—",
            waLabel: waRes ? waRes.label : "—",
            haZScore: haRes ? haRes.zScore : "—",
            haLabel: haRes ? haRes.label : "—",
            whZScore: whRes ? whRes.zScore : "—",
            whLabel: whRes ? whRes.label : "—",
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
