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
        <div id="loginError" style="color:#dc2626;margin-top:10px;min-height:20px"></div>
      </div>
    </div>
  `;
}

function setLoginError(message){
  const el = document.getElementById('loginError');
  if(el) el.textContent = message;
}

function showLoader(){
  const existing = document.getElementById('loaderOverlay');
  if(existing) return;
  const loader = document.createElement('div');
  loader.id = 'loaderOverlay';
  loader.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;font-weight:700';
  loader.textContent = 'טוען נתונים...';
  document.body.appendChild(loader);
}

function hideLoader(){
  document.getElementById('loaderOverlay')?.remove();
}

async function fetchJsonWithErrors(path){
  const res = await fetch(path);
  if(res.status === 404){
    throw new Error('not_found');
  }
  if(!res.ok){
    throw new Error('http_error');
  }

  try{
    return await res.json();
  }catch(_e){
    throw new Error('bad_json');
  }
}

async function login(){
  setLoginError('');
  const id = document.getElementById('empId').value.trim();
  const code = document.getElementById('empCode').value.trim();
  if(!id || !code) return;

  const hash = await sha256(id + code + SALT);
  showLoader();

  try{
    try{
      const json = await fetchJsonWithErrors(`./data/instructors/${hash}.json`);
      startApp(json, 'instructor', hash);
      return;
    }catch(e){
      if(e.message !== 'not_found') throw e;
    }

    try{
      const json = await fetchJsonWithErrors(`./data/admins/${hash}.json`);
      startApp(json, 'admin', hash);
      return;
    }catch(e){
      if(e.message === 'not_found'){
        setLoginError('פרטי הכניסה שגויים או הקובץ לא נמצא (404).');
        return;
      }
      throw e;
    }
  }catch(e){
    if(e.message === 'bad_json'){
      setLoginError('קובץ הנתונים פגום (JSON לא תקין).');
    }else{
      setLoginError('שגיאה בטעינת הנתונים. נסו שוב.');
    }
  }finally{
    hideLoader();
  }
}

function startApp(jsonData, role, hash){
  rawData = Array.isArray(jsonData) ? jsonData : [];
  userRole = role;

  sessionStorage.setItem('dash_hash', hash);
  sessionStorage.setItem('dash_role', role);

  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='block';

  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.onclick = ()=>{
      sessionStorage.clear();
      location.reload();
    };
  }

  loadDashboard();
}

function loadDashboard(){
  const script = document.createElement('script');
  script.src = 'dashboard.js';
  document.body.appendChild(script);
}

async function resumeSession(){
  const hash = sessionStorage.getItem('dash_hash');
  const role = sessionStorage.getItem('dash_role');
  if(!hash || !role) return false;

  const path = role === 'admin'
    ? `./data/admins/${hash}.json`
    : `./data/instructors/${hash}.json`;

  showLoader();
  try{
    const json = await fetchJsonWithErrors(path);
    startApp(json, role, hash);
    return true;
  }catch(_e){
    sessionStorage.clear();
    return false;
  }finally{
    hideLoader();
  }
}

(async ()=>{
  showLogin();
  await resumeSession();
})();
