const xlsx = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SALT = 'MY_SECRET_2026';

const mainWorkbook = xlsx.readFile('main.xlsx');
const codesWorkbook = xlsx.readFile('codes.xlsx');

const mainData = xlsx.utils.sheet_to_json(mainWorkbook.Sheets[mainWorkbook.SheetNames[0]]);
const codesData = xlsx.utils.sheet_to_json(codesWorkbook.Sheets[codesWorkbook.SheetNames[0]]);

const instructorsDir = path.join(__dirname, 'data', 'instructors');
const adminsDir = path.join(__dirname, 'data', 'admins');

function ensureCleanDir(dirPath){
  fs.mkdirSync(dirPath, { recursive: true });
  for(const file of fs.readdirSync(dirPath)){
    fs.rmSync(path.join(dirPath, file), { recursive: true, force: true });
  }
}

function toIsoString(value){
  if(!value) return null;

  if(value instanceof Date){
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if(typeof value === 'number'){
    const parsed = xlsx.SSF.parse_date_code(value);
    if(!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0)).toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeRow(row){
  const normalized = { ...row };

  const dateKeys = Object.keys(row).filter((key) => /^Date\d+$/i.test(key));
  const dateValues = dateKeys
    .map((key) => toIsoString(row[key]))
    .filter(Boolean);

  if(Array.isArray(row.Dates)){
    normalized.Dates = row.Dates.map((d) => toIsoString(d)).filter(Boolean);
  }else{
    normalized.Dates = dateValues;
  }

  normalized.End = toIsoString(row.End);
  return normalized;
}

ensureCleanDir(instructorsDir);
ensureCleanDir(adminsDir);

let filesCreated = 0;

for(const row of codesData){
  const { EmployeeID, EntryCode, Role } = row;

  if(!Role){
    throw new Error(`Missing Role for EmployeeID ${EmployeeID ?? 'unknown'}`);
  }

  if(!EmployeeID || !EntryCode){
    throw new Error(`Missing EmployeeID/EntryCode for Role ${Role}`);
  }

  const hash = crypto
    .createHash('sha256')
    .update(String(EmployeeID) + String(EntryCode) + SALT)
    .digest('hex');

  if(Role === 'instructor'){
    const instructorData = mainData
      .filter((r) => String(r.EmployeeID) === String(EmployeeID))
      .map(normalizeRow)
      .filter((r) => Array.isArray(r.Dates) && r.Dates.length > 0);

    if(instructorData.length === 0){
      continue;
    }

    fs.writeFileSync(path.join(instructorsDir, `${hash}.json`), JSON.stringify(instructorData, null, 2));
    filesCreated += 1;
  }else if(Role === 'admin'){
    const adminData = mainData
      .map(normalizeRow)
      .filter((r) => Array.isArray(r.Dates) && r.Dates.length > 0);

    if(adminData.length === 0){
      throw new Error('Admin dataset is empty.');
    }

    fs.writeFileSync(path.join(adminsDir, `${hash}.json`), JSON.stringify(adminData, null, 2));
    filesCreated += 1;
  }else{
    throw new Error(`Invalid Role '${Role}' for EmployeeID ${EmployeeID}`);
  }
}

if(filesCreated === 0){
  throw new Error('No JSON files were generated.');
}

console.log(`JSON files generated successfully: ${filesCreated}`);
