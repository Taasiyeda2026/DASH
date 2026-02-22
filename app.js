
const SALT = "MY_SECRET_2026";
let rawData = [];
let userRole = null;

async function sha256(text){
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
}

function showLogin(){
  document.getElementById('loginScreen').innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh">
      <div class="login-box">
        <h2>כניסה למערכת</h2>
        <input id="empId" placeholder="מספר עובד" style="width:100%;margin:8px 0;padding:8px">
        <input id="empCode" type="password" placeholder="קוד אישי" style="width:100%;margin:8px 0;padding:8px">
        <button onclick="login()" style="width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:8px">כניסה</button>
      </div>
    </div>
  `;
}

async function login(){
  const id = document.getElementById('empId').value.trim();
  const code = document.getElementById('empCode').value.trim();
  if(!id || !code) return;

  const hash = await sha256(id + code + SALT);

  try{
    let res = await fetch(`./data/instructors/${hash}.json`);
    if(res.ok){
      const json = await res.json();
      startApp(json,'instructor');
      return;
    }

    res = await fetch(`./data/admins/${hash}.json`);
    if(res.ok){
      const json = await res.json();
      startApp(json,'admin');
      return;
    }

    alert("פרטים שגויים");
  }catch(e){
    alert("שגיאה בטעינה");
  }
}

function startApp(jsonData, role){
  rawData = jsonData.map(r=>({
    ...r,
    Dates: r.Dates ? r.Dates.map(d=>new Date(d)) : []
  }));

  userRole = role;

  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='block';

  loadDashboard();
}

function loadDashboard(){
  const script = document.createElement('script');
  script.src = "dashboard.js";
  document.body.appendChild(script);
}

showLogin();
