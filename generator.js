const xlsx = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SALT = "MY_SECRET_2026";

const mainWorkbook = xlsx.readFile('main.xlsx');
const codesWorkbook = xlsx.readFile('codes.xlsx');

const mainData = xlsx.utils.sheet_to_json(mainWorkbook.Sheets[mainWorkbook.SheetNames[0]]);
const codesData = xlsx.utils.sheet_to_json(codesWorkbook.Sheets[codesWorkbook.SheetNames[0]]);

const instructorsDir = path.join(__dirname, 'data', 'instructors');
const adminsDir = path.join(__dirname, 'data', 'admins');

if (!fs.existsSync(instructorsDir)) fs.mkdirSync(instructorsDir, { recursive: true });
if (!fs.existsSync(adminsDir)) fs.mkdirSync(adminsDir, { recursive: true });

codesData.forEach(row => {
    const { EmployeeID, EntryCode, Role } = row;

    const hash = crypto
        .createHash('sha256')
        .update(EmployeeID + EntryCode + SALT)
        .digest('hex');

    if(Role === 'instructor'){
        const instructorData = mainData.filter(r => r.EmployeeID == EmployeeID);
        fs.writeFileSync(
            path.join(instructorsDir, `${hash}.json`),
            JSON.stringify(instructorData, null, 2)
        );
    }

    if(Role === 'admin'){
        fs.writeFileSync(
            path.join(adminsDir, `${hash}.json`),
            JSON.stringify(mainData, null, 2)
        );
    }
});

console.log("JSON files generated successfully.");
