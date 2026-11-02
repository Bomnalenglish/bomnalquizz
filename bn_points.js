/* ═══════════════════════════════════════════════════════════
   봄날 ENGLISH · 초등 포인트 도장판 (공용)

   학습 하나를 처음 끝낼 때마다 도장 하나 · 10포인트.
   도장 열 개(100포인트)마다 데스크 간식뽑기 한 번.
   포인트는 초기화하지 않고 계속 쌓는다.

   세는 기준은 Firestore 기록(quiz_results) 이므로 기기를 바꿔도 그대로다.
   같은 학습을 여러 번 풀어도 포인트는 처음 한 번만 준다.

   쓰는 법 (ES5 문법만 — 오래된 패드에서도 돌아가야 한다):
     <script src="bn_progress.js"></script>
     <script src="bn_points.js"></script>
     BN_POINTS.render(상자element);              // 카드를 그린다
     BN_POINTS.get().then(function(p){ p.points, p.stamps, p.draws, p.items });
═══════════════════════════════════════════════════════════ */
(function () {
  var PER = 10;          // 학습 하나 = 10포인트
  var BOARD = 10;        // 도장 열 개 = 간식뽑기 한 번
  var SEEN = 'bn_pt_seen';   // 지난번에 본 포인트 (새 도장을 반짝이게)

  function who() {
    try { return (localStorage.getItem('bn_name') || '').trim(); } catch (e) { return ''; }
  }

  /* 학습 하나를 가리키는 열쇠 — 리딩·듣기는 파일, 단어장은 교재+Day */
  function key(r) {
    if (r.file) return 'f:' + r.file;
    if (r.quizType && r.day) return 'd:' + r.quizType + '#' + r.day;
    if (r.quizType) return 'q:' + r.quizType;
    return '';
  }

  function label(r) {
    if (r.day) return (r.quizType || '단어장').replace(/^봄날보카[_ ]?/, '봄날보카 ') + ' · Day ' + r.day;
    var f = r.file || '';
    var m = f.match(/^bomnalreadingb(\d+)_(\d+)_(\d+)$/);        // basic 30-1 식
    if (m) return '봄날리딩 basic ' + m[1] + '-' + m[2] + ' · ' + m[3] + '과';
    m = f.match(/^bomnalreadingt?(\d+)_(\d+)$/);                   // 1권 / 튜터 1권
    if (m) return '봄날리딩 ' + (/t\d/.test(f) ? '튜터 ' : '') + m[1] + '권 · ' + m[2] + '지문';
    if (/^bomnalreading/.test(f)) return '봄날리딩 · ' + f.replace('bomnalreading', '');
    if (/^bomnallistening/.test(f)) return '봄날 듣기 · ' + f.replace('bomnallistening_', '');
    return r.quizType || f || '학습';
  }

  /* ── 포인트 계산 ── */
  var _p = null;
  function get(force) {
    if (_p && !force) return _p;
    if (!window.BN_PROGRESS) return Promise.resolve(empty());
    // 방금 끝낸 학습이 바로 도장으로 보이도록, 화면을 열 때는 새로 받아 온다
    _p = BN_PROGRESS.load(true).then(function (rows) {
      var seen = {}, items = [], i, r, k;
      // 오래된 것부터 봐야 '처음 끝낸 때'가 맞다
      var asc = rows.slice().sort(function (a, b) { return (a.time || 0) - (b.time || 0); });
      for (i = 0; i < asc.length; i++) {
        r = asc[i];
        if (!r.completed) continue;
        k = key(r);
        if (!k || seen[k]) continue;
        seen[k] = 1;
        items.push({ key: k, label: label(r), time: r.time });
      }
      var n = items.length;
      return {
        points: n * PER,
        stamps: n % BOARD,
        draws: Math.floor(n / BOARD),
        items: items.slice().reverse(),      // 최근 것이 앞으로
        count: n
      };
    })['catch'](function () { return empty(); });
    return _p;
  }

  function empty() { return { points: 0, stamps: 0, draws: 0, items: [], count: 0 }; }

  function lastSeen() {
    try { return parseInt(localStorage.getItem(SEEN) + '', 10) || 0; } catch (e) { return 0; }
  }
  function markSeen(p) {
    try { localStorage.setItem(SEEN, String(p)); } catch (e) {}
  }

  function todayStr(d) {
    if (!d) return '';
    var t = new Date();
    return (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth()
         && d.getDate() === t.getDate()) ? '오늘' : (d.getMonth() + 1) + '/' + d.getDate();
  }

  var CSS = ''
  + '.bnpt{background:linear-gradient(160deg,#fffdf8,#fbf3e4);border:2px solid #e8d7b4;'
  + 'border-radius:18px;padding:15px 15px 13px;margin-bottom:14px;box-shadow:0 3px 12px rgba(120,90,40,.08)}'
  + '.bnpt-top{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:11px}'
  + '.bnpt-nm{font-family:"Black Han Sans",sans-serif;font-size:1rem;color:#5c3d1e;letter-spacing:.3px}'
  + '.bnpt-nm span{display:block;margin-top:3px;font-family:inherit;font-size:.72rem;color:#8a7f74;letter-spacing:0;font-weight:400}'
  + '.bnpt-num{font-family:"Black Han Sans",sans-serif;font-size:2rem;line-height:1;color:#8a6a3e;white-space:nowrap}'
  + '.bnpt-num small{font-size:.78rem;color:#8a7f74;font-family:inherit;font-weight:400;margin-left:2px}'
  + '.bnpt-b{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}'
  + '.bnpt-c{aspect-ratio:1;border-radius:50%;border:2px dashed #ddd0b8;background:#fffefb;display:flex;'
  + 'align-items:center;justify-content:center;font-size:1.2rem;color:#cfc3ad}'
  + '.bnpt-c.on{border:2px solid #c9a961;background:#fdf3df;color:#5c3d1e;box-shadow:inset 0 1px 3px rgba(140,100,40,.14)}'
  + '.bnpt-c.nw{border-color:#c97b6a;background:#fdeee9;animation:bnpop .55s ease}'
  + '.bnpt-c.off{font-size:.64rem}'
  + '@keyframes bnpop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1)}}'
  + '.bnpt-note{margin-top:9px;font-size:.77rem;color:#8a7f74;text-align:center;line-height:1.6}'
  + '.bnpt-note b{color:#8a6a3e}'
  + '.bnpt-win{margin-top:9px;background:linear-gradient(135deg,#8a6a3e,#5c3d1e);color:#fff8ec;'
  + 'border-radius:12px;padding:10px 12px;font-size:.8rem;line-height:1.6;text-align:center}'
  + '.bnpt-win b{font-family:"Black Han Sans",sans-serif;letter-spacing:.3px}'
  + '.bnpt-draw{margin-top:8px;text-align:center;font-size:.75rem;color:#8a7f74}'
  + '.bnpt-draw b{color:#8a6a3e}'
  + '.bnpt-today{margin-top:10px;border-top:1px dashed #e6dac4;padding-top:9px}'
  + '.bnpt-today h4{font-size:.74rem;color:#8a7f74;font-weight:700;margin:0 0 5px}'
  + '.bnpt-row{display:flex;align-items:center;gap:7px;font-size:.76rem;color:#4a4036;padding:3px 0}'
  + '.bnpt-row .d{margin-left:auto;font-weight:800;color:#8a6a3e;font-size:.74rem;white-space:nowrap}';

  function style() {
    if (document.getElementById('bnptCss')) return;
    var st = document.createElement('style');
    st.id = 'bnptCss';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function draw(box, p) {
    style();
    var name = who();
    var grew = p.points - lastSeen();          // 지난번에 본 뒤로 새로 받은 포인트
    var fresh = grew > 0 ? Math.min(Math.floor(grew / PER), p.stamps || BOARD) : 0;
    var full = p.count > 0 && p.stamps === 0;  // 딱 열 칸을 채운 순간

    var h = '<div class="bnpt"><div class="bnpt-top"><div class="bnpt-nm">'
      + (name ? esc(name) + ' 어린이' : '내 포인트')
      + '<span>학습 하나를 끝내면 도장 하나 · 10포인트</span></div>'
      + '<div class="bnpt-num">' + p.points + '<small>P</small></div></div>';

    h += '<div class="bnpt-b">';
    for (var i = 0; i < BOARD; i++) {
      var on = full ? true : i < p.stamps;
      var nw = fresh > 0 && !full && i >= p.stamps - fresh && i < p.stamps;
      h += '<div class="bnpt-c' + (on ? ' on' : ' off') + (nw ? ' nw' : '') + '">'
         + (on ? '🌸' : ((i + 1) * PER)) + '</div>';
    }
    h += '</div>';

    if (full) {
      h += '<div class="bnpt-win">🍬 <b>간식뽑기 한 번!</b><br>데스크에 이 화면을 보여 주세요</div>';
    } else {
      var left = BOARD - p.stamps;
      h += '<div class="bnpt-note">도장 <b>' + left + '개</b> 더 모으면 <b>데스크 간식뽑기</b> 🍬</div>';
    }
    if (p.draws > 0) {
      h += '<div class="bnpt-draw">지금까지 간식뽑기 <b>' + p.draws + '번</b> 받았어요</div>';
    }

    var today = [];
    for (var j = 0; j < p.items.length && today.length < 3; j++) {
      if (todayStr(p.items[j].time) === '오늘') today.push(p.items[j]);
    }
    if (today.length) {
      h += '<div class="bnpt-today"><h4>오늘 받은 도장</h4>';
      for (var k = 0; k < today.length; k++) {
        h += '<div class="bnpt-row">🌸 ' + esc(today[k].label) + '<span class="d">+' + PER + 'P</span></div>';
      }
      h += '</div>';
    }
    h += '</div>';
    box.innerHTML = h;
    markSeen(p.points);
  }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(box, force) {
    if (!box) return Promise.resolve(empty());
    return get(force).then(function (p) {
      if (!who()) { box.innerHTML = ''; return p; }
      draw(box, p);
      return p;
    });
  }

  window.BN_POINTS = { get: get, render: render, PER: PER, BOARD: BOARD };
})();
