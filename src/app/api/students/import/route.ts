import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import * as XLSX from "xlsx";
// @ts-ignore
import * as XLSXStyle from "xlsx-js-style";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userLanguage = (session.user as any).language === "th" ? "th" : "en";

    try {
        const role = (session.user as any).role;
        const userSchoolId = (session.user as any).schoolId;
        
        let targetSchoolId = userSchoolId;
        
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const formSchoolId = formData.get("schoolId") as string;
        
        if (role !== "SCHOOL_STAFF" && formSchoolId) {
            targetSchoolId = formSchoolId;
        }

        if (!targetSchoolId) {
            return NextResponse.json({ error: "No school ID associated." }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        
        // Extract headers in original order to reconstruct exact columns for skipped rows
        const headers = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[]) || [];
        const weightColIdx = headers.findIndex(h => h === "น้ำหนัก" || h === "Weight");
        const heightColIdx = headers.findIndex(h => h === "ส่วนสูง" || h === "Height");

        const db = readDb();
        
        let studentsAdded = 0;
        let recordsAdded = 0;
        const warnings: any[] = [];
        const skippedRowsAoa: any[][] = [];
        const errorCells: { r: number; c: number }[] = [];

        rows.forEach((row, rowIndex) => {
            // Support Thai or English headers
            const studentId = String(row["เลขประจำตัว"] || row["Student ID"] || "").trim();
            const thaiId = String(row["รหัสบัตรประชาชน"] || row["Thai ID"] || "").trim();
            
            if ((!studentId || studentId === "-") && (!thaiId || thaiId === "-")) {
                return; // Skip empty rows
            }

            const prefix = String(row["คำนำ"] || row["Prefix"] || "").trim();
            const firstName = String(row["ชื่อ"] || row["First Name"] || "").trim();
            const surName = String(row["นามสกุล"] || row["Last Name"] || "").trim();
            const studentName = `${prefix} ${firstName} ${surName}`.trim() || studentId || "Unknown Student";

            const weightRaw = row["น้ำหนัก"] !== undefined ? row["น้ำหนัก"] : row["Weight"];
            const heightRaw = row["ส่วนสูง"] !== undefined ? row["ส่วนสูง"] : row["Height"];

            let rowHasErrors = false;
            const rowWarnings: any[] = [];
            const isTh = userLanguage === "th";

            // Weight validation
            if (weightRaw !== undefined && weightRaw !== null && String(weightRaw).trim() !== "" && String(weightRaw) !== "-") {
                const parsedWeight = parseFloat(weightRaw);
                if (isNaN(parsedWeight) || parsedWeight < 10 || parsedWeight > 200) {
                    rowHasErrors = true;
                    rowWarnings.push({
                        field: isTh ? "น้ำหนัก (Weight)" : "Weight (น้ำหนัก)",
                        value: weightRaw,
                        expected: "10 - 200 kg",
                        message: isTh
                            ? (isNaN(parsedWeight) ? `น้ำหนักมีค่าไม่ใช่ตัวเลข: ${weightRaw}` : `น้ำหนักมีค่าผิดปกติ: ${parsedWeight} กก. (ควรอยู่ระหว่าง 10 - 200 กก.)`)
                            : (isNaN(parsedWeight) ? `Weight is not a number: ${weightRaw}` : `Abnormal weight: ${parsedWeight} kg (expected 10 - 200 kg)`)
                    });
                }
            }

            // Height validation
            if (heightRaw !== undefined && heightRaw !== null && String(heightRaw).trim() !== "" && String(heightRaw) !== "-") {
                const parsedHeight = parseFloat(heightRaw);
                if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 220) {
                    rowHasErrors = true;
                    rowWarnings.push({
                        field: isTh ? "ส่วนสูง (Height)" : "Height (ส่วนสูง)",
                        value: heightRaw,
                        expected: "50 - 220 cm",
                        message: isTh
                            ? (isNaN(parsedHeight) ? `ส่วนสูงมีค่าไม่ใช่ตัวเลข: ${heightRaw}` : `ส่วนสูงมีค่าผิดปกติ: ${parsedHeight} ซม. (ควรอยู่ระหว่าง 50 - 220 ซม.)`)
                            : (isNaN(parsedHeight) ? `Height is not a number: ${heightRaw}` : `Abnormal height: ${parsedHeight} cm (expected 50 - 220 cm)`)
                    });
                }
            }

            // If there are validation issues, skip database import and collect row
            if (rowHasErrors) {
                rowWarnings.forEach(w => {
                    warnings.push({
                        row: rowIndex + 2, // Data rows start after header row in Excel (0-based rowIndex maps to 2)
                        studentId: studentId || thaiId || "Unknown",
                        name: studentName,
                        field: w.field,
                        value: w.value,
                        expected: w.expected,
                        message: w.message
                    });
                });

                // Convert row object into ordered array aligned with original headers
                const rowValues = headers.map(h => row[h] !== undefined ? row[h] : "");
                skippedRowsAoa.push(rowValues);

                const sheetRowIdx = skippedRowsAoa.length; // Row index in the output sheet (1-based: headers are at index 0)
                if (rowWarnings.some(w => w.field.startsWith("Weight"))) {
                    if (weightColIdx !== -1) {
                        errorCells.push({ r: sheetRowIdx, c: weightColIdx });
                    }
                }
                if (rowWarnings.some(w => w.field.startsWith("Height"))) {
                    if (heightColIdx !== -1) {
                        errorCells.push({ r: sheetRowIdx, c: heightColIdx });
                    }
                }

                return; // SKIP IMPORTING THIS ROW
            }

            // Proceed with importing correct data
            let dobRaw = row["วันเกิด"] || row["Date of Birth"];
            let dobValue = new Date().toISOString();
            if (dobRaw) {
                const parsed = new Date(dobRaw);
                if (!isNaN(parsed.getTime())) dobValue = parsed.toISOString();
            }

            const classVal = String(row["ชั้น"] || row["Class"] || "").trim();
            const roomVal = String(row["ห้อง"] || row["Room"] || "").trim();
            const orderNum = parseInt(row["เลขที่"] || row["Order Number"] || "0", 10);
            const ageVal = parseInt(row["อายุ"] || row["Age"] || "0", 10) || null;

            // Check if student exists in the target school
            let student = db.students.find(s => 
                ((studentId && s.studentId === studentId) || (thaiId && s.thaiId === thaiId)) 
                && s.schoolId === targetSchoolId
            );

            if (!student) {
                student = {
                    id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    studentId: studentId,
                    thaiId: thaiId || null,
                    orderNumber: orderNum,
                    class: `${classVal}/${roomVal}`.replace(/^\//, "").replace(/\/$/, ""),
                    gender: prefix.includes("หญิง") || prefix.includes("ด.ญ.") || prefix.includes("น.ส.") || prefix.toLowerCase().includes("female") || prefix.toLowerCase().includes("miss") ? "Female" : "Male",
                    prefix: prefix,
                    firstName: firstName,
                    surName: surName,
                    dob: dobValue,
                    age: ageVal,
                    schoolId: targetSchoolId,
                    createdAt: new Date().toISOString()
                };
                db.students.push(student);
                studentsAdded++;
            } else {
                // Update profile info if present
                if (thaiId && !student.thaiId) student.thaiId = thaiId;
                if (dobRaw) student.dob = dobValue;
                if (firstName) student.firstName = firstName;
                if (surName) student.surName = surName;
                if (prefix) {
                    student.prefix = prefix;
                    student.gender = prefix.includes("หญิง") || prefix.includes("ด.ญ.") || prefix.includes("น.ส.") || prefix.toLowerCase().includes("female") || prefix.toLowerCase().includes("miss") ? "Female" : "Male";
                }
                if (classVal || roomVal) {
                    student.class = `${classVal || student.class.split('/')[0]}/${roomVal || student.class.split('/')[1] || ""}`.replace(/^\//, "").replace(/\/$/, "");
                }
                if (orderNum) student.orderNumber = orderNum;
                if (ageVal) student.age = ageVal;

                const idx = db.students.findIndex(s => s.id === student.id);
                if (idx > -1) db.students[idx] = student;
            }

            // Health Data parsing
            const academicYearVal = String(row["ปีการศึกษา"] || row["Academic Year"] || new Date().getFullYear()).trim();
            
            let weightVal = null;
            let heightVal = null;
            let bmiVal = null;

            if (weightRaw !== undefined && weightRaw !== null && String(weightRaw).trim() !== "" && String(weightRaw) !== "-") {
                const parsedWeight = parseFloat(weightRaw);
                if (!isNaN(parsedWeight)) {
                    weightVal = parsedWeight;
                }
            }

            if (heightRaw !== undefined && heightRaw !== null && String(heightRaw).trim() !== "" && String(heightRaw) !== "-") {
                const parsedHeight = parseFloat(heightRaw);
                if (!isNaN(parsedHeight)) {
                    heightVal = parsedHeight;
                }
            }

            // Calculate BMI
            if (weightVal && heightVal) {
                const heightInMeters = heightVal / 100;
                bmiVal = parseFloat((weightVal / (heightInMeters * heightInMeters)).toFixed(1));
            }

            // Parse remaining diagnostic and health checks
            const bloodTypeVal = String(row["กรุ๊ปเลือด"] || row["Blood Type"] || "UNKNOWN").toUpperCase().trim();
            const underlyingDiseaseVal = String(row["โรคประจำตัว"] || row["Underlying Disease"] || "").trim();
            const drugAllergyVal = String(row["ประวัติแพ้ยา"] || row["Drug Allergy"] || "").trim();
            const hearingTestVal = String(row["การได้ยิน"] || row["Hearing Test"] || "Normal ปกติ").trim();
            const colorBlindnessVal = String(row["ตาบอดสี"] || row["Color Blindness"] || "Pass ผ่าน").trim();
            const visionLeftVal = String(row["การมองเห็นซ้าย"] || row["Vision Left"] || "—").trim();
            const visionRightVal = String(row["การมองเห็นขวา"] || row["Vision Right"] || "—").trim();
            const xRayResultVal = String(row["ผลเอ็กซเรย์"] || row["X-Ray Result"] || "—").trim();
            const flexibilityVal = parseFloat(row["ความอ่อนตัว"] || row["Flexibility"]) || null;
            const handgripVal = parseFloat(row["แรงบีบมือ"] || row["Handgrip Strength"]) || null;
            const symptomsVal = String(row["อาการเบื้องต้น"] || row["Symptoms"] || "").trim();
            const additionalNotesVal = String(row["บันทึกเพิ่มเติม"] || row["Additional Notes"] || "").trim();

            // Find or create HealthRecord for this student and academic year
            let healthRecord = db.healthRecords.find(hr => 
                hr.studentId === student.id && hr.academicYear === academicYearVal
            );

            const healthRecordData = {
                academicYear: academicYearVal,
                underlyingDisease: underlyingDiseaseVal,
                drugAllergy: drugAllergyVal,
                bloodType: bloodTypeVal,
                weight: weightVal,
                height: heightVal,
                bmi: bmiVal,
                hearingTest: hearingTestVal,
                colorBlindness: colorBlindnessVal,
                visionBothEyesLeft: visionLeftVal,
                visionBothEyesRight: visionRightVal,
                xRayResult: xRayResultVal,
                flexibility: flexibilityVal,
                handgripStrength: handgripVal,
                symptoms: symptomsVal,
                additionalNotes: additionalNotesVal,
                updatedAt: new Date().toISOString()
            };

            if (!healthRecord) {
                healthRecord = {
                    id: `hr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    studentId: student.id,
                    recordedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    ...healthRecordData
                };
                db.healthRecords.push(healthRecord);
                recordsAdded++;
            } else {
                Object.assign(healthRecord, healthRecordData);
                const hrIdx = db.healthRecords.findIndex(hr => hr.id === healthRecord.id);
                if (hrIdx > -1) db.healthRecords[hrIdx] = healthRecord;
                recordsAdded++;
            }
        });

        // Write updates to DB
        writeDb(db);

        // Generate styled incorrect records file if any records were skipped
        let errorFileBase64 = "";
        if (skippedRowsAoa.length > 0) {
            const errorWb = XLSXStyle.utils.book_new();
            const errorWs = XLSXStyle.utils.aoa_to_sheet([headers, ...skippedRowsAoa]);

            // Set column widths for readability
            errorWs["!cols"] = headers.map(() => ({ wch: 15 }));

            // Style headers to look professional
            for (let c = 0; c < headers.length; c++) {
                const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c });
                if (errorWs[cellRef]) {
                    errorWs[cellRef].s = {
                        fill: { patternType: "solid", fgColor: { rgb: "E2E8F0" } },
                        font: { bold: true, color: { rgb: "1E293B" } },
                        alignment: { horizontal: "center" }
                    };
                }
            }

            // Highlight error cells in red
            errorCells.forEach(cell => {
                const cellRef = XLSXStyle.utils.encode_cell(cell);
                if (errorWs[cellRef]) {
                    errorWs[cellRef].s = {
                        fill: {
                            patternType: "solid",
                            fgColor: { rgb: "FFC7CE" } // Light red background
                        },
                        font: {
                            color: { rgb: "9C0006" }, // Dark red text
                            bold: true
                        },
                        border: {
                            top: { style: "thin", color: { rgb: "9C0006" } },
                            bottom: { style: "thin", color: { rgb: "9C0006" } },
                            left: { style: "thin", color: { rgb: "9C0006" } },
                            right: { style: "thin", color: { rgb: "9C0006" } }
                        }
                    };
                }
            });

            XLSXStyle.utils.book_append_sheet(errorWb, errorWs, userLanguage === "th" ? "ข้อมูลที่ไม่ถูกต้อง" : "Incorrect Records");
            const errorBuf = XLSXStyle.write(errorWb, { type: "buffer", bookType: "xlsx" });
            errorFileBase64 = errorBuf.toString("base64");
        }

        return NextResponse.json({ 
            success: true, 
            studentsAdded,
            recordsAdded,
            skippedCount: skippedRowsAoa.length,
            warnings,
            errorFileBase64,
            errorFileName: `incorrect-student-health-records-${new Date().toISOString().slice(0,10)}.xlsx`
        });

    } catch (e: any) {
        console.error("IMPORT ERROR:", e);
        return NextResponse.json({ error: e.message || "Failed to parse Excel" }, { status: 500 });
    }
}
