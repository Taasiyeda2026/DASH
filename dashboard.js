
// ===============================================
//  PASTE YOUR FULL DASHBOARD JS CODE HERE
//  IMPORTANT:
//  - REMOVE XLSX LOADING
//  - USE global rawData
//  - DO NOT LOAD EXCEL
// ===============================================

document.getElementById('app').innerHTML = `
  <div style="padding:30px">
    <h2>דשבורד נטען</h2>
    <p>תפקיד: ${userRole}</p>
    <pre>${JSON.stringify(rawData, null, 2)}</pre>
  </div>
`;
