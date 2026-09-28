/* ═══════════════════════════════════════════════════════════
   봄날 ENGLISH · 결과 저장 예비 경로 (일반 스크립트 · ES5 문법만)

   퀴즈 파일들은 Firebase SDK로 결과를 저장하는데, 이 SDK는 ES 모듈이라
   오래된 브라우저(크롬 60 이하)에서는 아예 실행되지 않는다.
   그런 기기에서 학생 결과가 사라지지 않도록, 모듈이 끝내 준비되지 않으면
   Firestore REST로 직접 저장한다.

   사용법: <script src="bn_save.js"></script>   (module 아님)
═══════════════════════════════════════════════════════════ */
(function () {
  var BASE = 'https://firestore.googleapis.com/v1/projects/bomnalvaca/databases/(default)/documents/';

  function val(v) {
    if (v === null || typeof v === 'undefined') return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return (v === Math.floor(v)) ? { integerValue: String(v) } : { doubleValue: v };
    if (Object.prototype.toString.call(v) === '[object Array]') {
      var arr = [], i;
      for (i = 0; i < v.length; i++) arr.push(val(v[i]));
      return { arrayValue: { values: arr } };
    }
    if (typeof v === 'object') {
      var f = {}, k;
      for (k in v) { if (Object.prototype.hasOwnProperty.call(v, k)) f[k] = val(v[k]); }
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v) };
  }

  function post(coll, data) {
    if (typeof fetch === 'undefined') return Promise.reject(new Error('no fetch'));
    var fields = {}, k;
    for (k in data) { if (Object.prototype.hasOwnProperty.call(data, k)) fields[k] = val(data[k]); }
    if (!fields.submittedAt) fields.submittedAt = { stringValue: new Date().toISOString() };
    if (!fields.date) fields.date = { stringValue: new Date().toLocaleString('ko-KR') };
    return fetch(BASE + coll, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fields })
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return true;
    });
  }

  window._bnRestSave = function (data) { return post('quiz_results', data); };

  /* 모듈이 준비되지 않았으면(구형 브라우저·gstatic 차단) 저장 함수를 대신 채운다.
     이미 SDK가 채워 놓았으면 건드리지 않는다. */
  function fill() {
    var names = ['_saveResult', '_saveQuiz', '_fbSave'], i;
    for (i = 0; i < names.length; i++) {
      try {
        if (typeof window[names[i]] !== 'function') window[names[i]] = window._bnRestSave;
      } catch (e) {}
    }
    /* 접속 기록도 남겨 둔다 */
    try {
      if (typeof window._logAccess !== 'function') {
        window._logAccess = function (d) {
          var rec = {}, k;
          for (k in d) { if (Object.prototype.hasOwnProperty.call(d, k)) rec[k] = d[k]; }
          rec.userAgent = String(navigator.userAgent).substring(0, 120);
          rec.timestamp = new Date().toISOString();
          return post('hub_access', rec)['catch'](function () { return false; });
        };
      }
    } catch (e) {}
  }

  if (window.addEventListener) window.addEventListener('load', function () { setTimeout(fill, 4000); });
  else setTimeout(fill, 6000);
})();
