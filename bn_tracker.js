/* ═══════════════════════════════════════════════════════════
   봄날 ENGLISH · 공통 접속 트래커
   - 모든 퀴즈 페이지의 진입을 hub_access 컬렉션에 기록
   - localStorage(bn_name, bn_school)에서 학생 정보 자동 추출
   - 직접 URL 접속·메뉴를 통한 접속 모두 추적
   사용법: <script type="module" src="bn_tracker.js"></script>
═══════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const cfg = {
  apiKey: "AIzaSyCxS524S8KAaF87DomPtl9sJdF-eqes404",
  authDomain: "bomnalvaca.firebaseapp.com",
  projectId: "bomnalvaca",
  storageBucket: "bomnalvaca.firebasestorage.app",
  messagingSenderId: "115868052300",
  appId: "1:115868052300:web:765c08867b6f1ce0987de9"
};

const app = initializeApp(cfg);
const db = getFirestore(app);

/* 파일명에서 학교/학년/단원 등의 메타데이터 추출 */
function extractMeta(filename) {
  const meta = {};
  // 학교
  if (filename.startsWith('jongchon_')) meta.school = '종촌중';
  else if (filename.startsWith('eojin_')) meta.school = '어진중';
  else if (filename.startsWith('goun_')) meta.school = '고운중';
  else if (filename.startsWith('jongchonko_')) meta.school = '종촌고';
  else if (filename.startsWith('gounko_')) meta.school = '고운고';
  else if (filename.startsWith('daesung_')) meta.school = '대성고';
  else if (filename.startsWith('mock_')) meta.school = '모의고사';
  // 학년
  const gm = filename.match(/(\d)grade|go(\d)|g(\d)/);
  if (gm) meta.grade = (gm[1] || gm[2] || gm[3]) + '학년';
  // 연도 (모의고사)
  const ym = filename.match(/_(20\d{2})_/);
  if (ym) meta.year = ym[1];
  return meta;
}

window._logAccess = async (data) => {
  try {
    await addDoc(collection(db, "hub_access"), {
      ...data,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent.substring(0, 120)
    });
  } catch (e) {
    console.log("log fail", e);
  }
};

(function autoLog() {
  // 학생 정보를 localStorage에서 가져옴 (index.html 거치지 않고 직접 URL로 와도 동작)
  const name = localStorage.getItem('bn_name') || sessionStorage.getItem('bn_name') || '익명';
  const school = localStorage.getItem('bn_school') || sessionStorage.getItem('bn_school') || '미입력';
  const file = (location.pathname.split('/').pop() || '').replace('.html','');
  const meta = extractMeta(file);
  const referrer = document.referrer ? (new URL(document.referrer)).pathname.replace('/bomnalquizz/','').replace('.html','') : 'direct';

  window._logAccess({
    type: 'quiz_open',
    name,
    school,
    quiz: document.title || file,
    file,
    referrer,
    targetSchool: meta.school || '',
    targetGrade: meta.grade || '',
    targetYear: meta.year || ''
  });
})();

/* ───────────────────────────────────────────────────────────
   로그인된 학생 정보를 모든 퀴즈의 이름·학교 입력란에 자동 주입
   - id 또는 name 속성에 name/school/student가 들어가는 input/select 인식
   - select의 경우 option 텍스트·value 중 학교명을 포함하는 것 우선 선택
   - 단일 옵션만 있는 select는 그 옵션 선택 (예: "어진중3" 한 개만 있는 폼)
   - 채운 뒤 change·input 이벤트 발생시켜 UI 반응 트리거
─────────────────────────────────────────────────────────── */
function autoFillIdentity(){
  const name = localStorage.getItem('bn_name') || sessionStorage.getItem('bn_name') || '';
  const school = localStorage.getItem('bn_school') || sessionStorage.getItem('bn_school') || '';
  if (!name && !school) return;

  const NAME_RE = /name|student|이름|학생/i;
  const SCHOOL_RE = /school|grade|학교|학년/i;
  // 입력란 식별: id, name 속성 또는 인근 label/placeholder
  const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
  inputs.forEach(el => {
    if (el.value) return; // 사용자가 입력한 값이 있으면 건드리지 않음
    const tag = (el.id||'') + ' ' + (el.name||'') + ' ' + (el.placeholder||'');
    if (name && NAME_RE.test(tag)) {
      el.value = name;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    }
  });
  document.querySelectorAll('select').forEach(sel => {
    if (sel.value) return;
    const tag = (sel.id||'') + ' ' + (sel.name||'');
    if (!SCHOOL_RE.test(tag)) return;
    const opts = Array.from(sel.options).filter(o => o.value && o.value.trim());
    if (opts.length === 0) return;
    let pick = null;
    if (school) {
      // 학교명에 포함되는 option을 우선 선택 (어진중3 → 어진중학교 포함 또는 그 반대)
      pick = opts.find(o => o.value === school)
          || opts.find(o => o.value.includes(school) || school.includes(o.value))
          || opts.find(o => o.text.includes(school) || school.includes(o.text));
    }
    if (!pick && opts.length === 1) pick = opts[0]; // 선택지 1개뿐이면 자동 선택
    if (pick) {
      sel.value = pick.value;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    }
  });
}

// DOM 준비된 뒤 자동 채움 (이미 준비됐다면 즉시)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoFillIdentity);
} else {
  autoFillIdentity();
}
// 화면 전환·동적 추가 대응 — 2초 뒤 한 번 더 시도
setTimeout(autoFillIdentity, 2000);

window._autoFillIdentity = autoFillIdentity;

/* ───────────────────────────────────────────────────────────
   결과 저장 안전망: localStorage 백업 + Firestore REST API + 다음 페이지 진입 시 재시도
   - 각 퀴즈 파일의 _fbSave / _saveResult 호출이 await 없이 fire-and-forget으로
     진행되어 학생이 결과 직후 탭을 닫으면 네트워크 요청이 취소되던 문제를 보완
   - window._fbSave / window._saveResult를 자동으로 감싸 (Object.defineProperty)
     호출 시 localStorage에 먼저 백업 → Firestore 저장 → 성공하면 백업 제거
   - 페이지 진입 때마다 미전송 백업을 REST API (keepalive)로 재시도
─────────────────────────────────────────────────────────── */
const _RESTFS_BASE = 'https://firestore.googleapis.com/v1/projects/bomnalvaca/databases/(default)/documents';
const _PENDING_KEY = 'bn_pending_saves';

function _toFs(v){
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(_toFs) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = _toFs(v[k]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function _readPending(){
  try { return JSON.parse(localStorage.getItem(_PENDING_KEY) || '[]'); } catch(e){ return []; }
}
function _writePending(arr){
  try { localStorage.setItem(_PENDING_KEY, JSON.stringify(arr)); } catch(e){}
}
function _pushPending(item){ const a=_readPending(); a.push(item); _writePending(a); }
function _dropPending(id){ const a=_readPending().filter(p=>p.id!==id); _writePending(a); }

async function _postOneRest(collectionName, data){
  // submittedAt 보강 (서버 timestamp는 REST에서 사용 불편 — 클라이언트 ISO 문자열로 대체)
  const enriched = { ...data, submittedAt: data.submittedAt || new Date().toISOString() };
  const payload = { fields: {} };
  for (const k of Object.keys(enriched)) payload.fields[k] = _toFs(enriched[k]);
  try {
    const resp = await fetch(`${_RESTFS_BASE}/${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true   // 페이지 unload 후에도 요청 완료
    });
    return resp.ok;
  } catch(e){
    return false;
  }
}

function _newId(){ return 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); }

// _fbSave / _saveResult를 호출 시 자동으로 백업·재시도하도록 래핑
function _wrapSaveSlot(slotName, collectionName){
  let _orig = null;
  Object.defineProperty(window, slotName, {
    configurable: true,
    set(fn){ _orig = fn; },
    get(){
      return async function(data){
        const id = _newId();
        _pushPending({ id, collection: collectionName, data, ts: Date.now() });
        let saved = false;
        if (_orig) {
          try { await _orig(data); saved = true; } catch(e){ /* 실패 시 REST 폴백 */ }
        }
        if (!saved) saved = await _postOneRest(collectionName, data);
        if (saved) _dropPending(id);
        return saved;
      };
    }
  });
}
_wrapSaveSlot('_fbSave', 'quiz_results');
_wrapSaveSlot('_saveResult', 'quiz_results');

// 페이지 진입 시 미전송 백업 재시도 (7일 지난 항목은 폐기)
(async function _flushPending(){
  const now = Date.now();
  let arr = _readPending().filter(p => now - p.ts < 7*24*3600*1000);
  _writePending(arr);
  for (const p of arr) {
    const ok = await _postOneRest(p.collection || 'quiz_results', p.data);
    if (ok) _dropPending(p.id);
  }
})();
