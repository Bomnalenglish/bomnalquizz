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
