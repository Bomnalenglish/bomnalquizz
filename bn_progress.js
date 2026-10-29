/* ═══════════════════════════════════════════════════════════
   봄날 ENGLISH · 내 진도 불러오기 (공용)

   학생이 어디까지 했는지는 지금까지 그 기기(localStorage)에만 남아서,
   패드를 바꾸거나 집에서 열면 ✅ 표시가 모두 사라졌다.
   결과 자체는 Firestore(quiz_results)에 Day 번호·회차까지 저장돼 있으므로,
   여기서 그 기록을 읽어 어느 기기에서든 같은 진도가 보이게 한다.

   사용법 (일반 스크립트 · ES5 문법만):
     <script src="bn_progress.js"></script>
     BN_PROGRESS.days('봄날보카_워드마스터중등BASIC800')
       .then(function(info){ info.done  // [1,2,3...]  끝낸 Day
                             info.last  // {day, score, time}  마지막에 한 것
                             info.next  // 다음에 할 Day });
     BN_PROGRESS.files().then(function(m){ m['bomnallistening_e3_1_01'] // {score, time, n}
     });
═══════════════════════════════════════════════════════════ */
(function () {
  var BASE = 'https://firestore.googleapis.com/v1/projects/bomnalvaca/databases/(default)/documents:runQuery';
  var CACHE_MIN = 5;          // 같은 세션에서 5분 안에는 다시 받지 않는다
  var LIMIT = 1200;

  /* 가져올 항목만 집어서 받는다 (오답 단어 목록까지 받으면 너무 무겁다) */
  var FIELDS = ['studentName', 'name', 'school', 'quizType', 'type', 'quiz', 'file',
    'day', 'wpd', 'round', 'score', 'accuracy', 'total', 'totalQ', 'correct',
    'completed', 'retryDone', 'level', 'unit', 'timestamp', 'submittedAt'];

  function who() {
    try {
      return (localStorage.getItem('bn_name') || sessionStorage.getItem('bn_name') || '').trim();
    } catch (e) { return ''; }
  }

  /* ── Firestore 값 → 보통 값 ── */
  function dec(v) {
    if (!v || typeof v !== 'object') return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return parseInt(v.integerValue, 10);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) {
      var a = (v.arrayValue.values || []), out = [], i;
      for (i = 0; i < a.length; i++) out.push(dec(a[i]));
      return out;
    }
    if ('mapValue' in v) {
      var f = (v.mapValue.fields || {}), o = {}, k;
      for (k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) o[k] = dec(f[k]); }
      return o;
    }
    return null;
  }

  function flat(doc) {
    var f = doc.fields || {}, o = {}, k;
    for (k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) o[k] = dec(f[k]); }
    o._id = (doc.name || '').split('/').pop();
    return o;
  }

  /* ── 한 번 질의 ── */
  function ask(field, value) {
    var sel = [], i;
    for (i = 0; i < FIELDS.length; i++) sel.push({ fieldPath: FIELDS[i] });
    var body = {
      structuredQuery: {
        from: [{ collectionId: 'quiz_results' }],
        select: { fields: sel },
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value }
          }
        },
        limit: LIMIT
      }
    };
    return fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (rows) {
      var out = [], j;
      if (!rows || !rows.length) return out;
      for (j = 0; j < rows.length; j++) {
        if (rows[j] && rows[j].document) out.push(flat(rows[j].document));
      }
      return out;
    })['catch'](function () { return []; });
  }

  /* ── 기록 한 줄을 쓰기 좋은 모양으로 ── */
  function tidy(x) {
    var qt = x.quizType || x.type || x.quiz || '';
    var sc = (typeof x.score === 'number') ? x.score
           : (typeof x.accuracy === 'number') ? x.accuracy : null;
    var t = x.timestamp || x.submittedAt || '';
    return {
      quizType: qt,
      file: x.file || '',
      day: (typeof x.day === 'number') ? x.day : null,
      wpd: (typeof x.wpd === 'number') ? x.wpd : null,
      words: (typeof x.total === 'number') ? x.total : null,
      score: sc,
      completed: (x.completed === true) || (x.retryDone === true),
      level: x.level || '',
      unit: x.unit,
      time: t ? new Date(t) : null,
      raw: x
    };
  }

  /* ── 전체 불러오기 (세션 안에서 재사용) ── */
  var _p = null;
  function load(force) {
    var n = who();
    if (!n) return Promise.resolve([]);
    var ck = 'bnprog:' + n;
    if (!force) {
      try {
        var c = JSON.parse(sessionStorage.getItem(ck) || 'null');
        if (c && (Date.now() - c.at) < CACHE_MIN * 60000) {
          return Promise.resolve(c.rows.map(function (r) {
            r.time = r.time ? new Date(r.time) : null; return r;
          }));
        }
      } catch (e) {}
    }
    if (_p && !force) return _p;
    _p = Promise.all([ask('studentName', n), ask('name', n)]).then(function (two) {
      var all = two[0].concat(two[1]), seen = {}, out = [], i, r;
      for (i = 0; i < all.length; i++) {
        r = all[i];
        if (seen[r._id]) continue;
        seen[r._id] = 1;
        // 문제 한 개짜리 기록(워크북 중간 로그)은 진도가 아니다
        if (r.q !== undefined) continue;
        out.push(tidy(r));
      }
      out.sort(function (a, b) { return (b.time || 0) - (a.time || 0); });
      try {
        sessionStorage.setItem(ck, JSON.stringify({
          at: Date.now(),
          rows: out.map(function (r) {
            var c = {}, k;
            for (k in r) { if (k !== 'raw') c[k] = r[k]; }
            c.time = r.time ? r.time.toISOString() : null;
            return c;
          })
        }));
      } catch (e) {}
      return out;
    })['catch'](function () { return []; });
    return _p;
  }

  /* ── 단어장: 끝낸 Day ──
     opts.wpd 를 주면 하루 단어수가 같은 기록만 센다
     (하루 20개로 풀던 아이가 30개로 바꾸면 Day 번호의 뜻이 달라지기 때문) */
  function days(quizType, opts) {
    opts = opts || {};
    return load().then(function (rows) {
      var done = [], last = null, i, r;
      for (i = 0; i < rows.length; i++) {
        r = rows[i];
        if (!r.day || r.quizType !== quizType) continue;
        if (opts.wpd) {
          var w = r.wpd || r.words;              // 저장된 하루 단어수, 없으면 그때 푼 단어 수
          // 마지막 Day 는 단어가 모자랄 수 있으니 그 경우만 봐준다
          if (w && w !== opts.wpd && !(opts.lastDay && r.day === opts.lastDay)) continue;
        }
        if (!r.completed) continue;              // 끝까지 푼 것만 ✅
        if (done.indexOf(r.day) < 0) done.push(r.day);
        if (!last) last = { day: r.day, score: r.score, time: r.time };
      }
      done.sort(function (a, b) { return a - b; });
      var next = 1;
      while (done.indexOf(next) >= 0) next++;    // 빠진 첫 Day 가 다음에 할 곳
      return { done: done, last: last, next: next };
    });
  }

  /* ── 듣기·리딩: 끝낸 파일 ── */
  function files() {
    return load().then(function (rows) {
      var m = {}, i, r, k;
      for (i = 0; i < rows.length; i++) {
        r = rows[i];
        k = r.file;
        if (!k) continue;
        if (!m[k]) m[k] = { score: r.score, time: r.time, n: 0, completed: false };
        m[k].n++;
        if (r.completed) m[k].completed = true;
        if (m[k].score === null || (r.score !== null && r.score > m[k].score)) m[k].score = r.score;
        if (!m[k].time || (r.time && r.time > m[k].time)) m[k].time = r.time;
      }
      return m;
    });
  }

  window.BN_PROGRESS = { load: load, days: days, files: files, who: who };
})();
