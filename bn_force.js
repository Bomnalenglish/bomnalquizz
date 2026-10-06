/* 봄날퀴즈 · 오답 필수 지키기 (공용)
   ① 결과 화면에 '오답 다시 풀기' 버튼이 보이면
        · 바로 아래에 빨간 안내문을 넣는다
        · 그 상태로 창을 닫으려 하면 한 번 물어본다
        · 오답을 다 풀어 버튼이 사라지면 잠금을 푼다
   ② 다시 풀기 기능이 없는 퀴즈라도, 결과 화면에 오답이 있으면
        · '오답을 모두 확인했어요' 를 누르기 전에는 창을 닫으려 할 때 물어본다
   ES5 문법만 사용 (오래된 태블릿 호환) */
(function () {
  if (window.__bnForce) return;
  window.__bnForce = 1;

  var RE_BTN = /오답[\s\S]{0,8}다시|틀린[\s\S]{0,18}다시/;
  var RE_CNT = /오답\s*[(（]?\s*([0-9]+)\s*개|틀린\s*[^0-9]{0,8}([0-9]+)\s*개/;

  var armed = false;
  var note = null;          // 빨간 안내문
  var okBtn = null;         // '오답을 모두 확인했어요' 버튼
  var confirmed = false;    // ② 에서 확인 버튼을 눌렀는지
  var sawWrong = false;     // 오답 목록이 화면에 떠 있는 상태였는지

  function visible(el) {
    if (!el) return false;
    try {
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      var r = el.getBoundingClientRect();
      if (!(r.width > 4 && r.height > 4)) return false;
      var p = el.parentNode;
      while (p && p.nodeType === 1) {
        var pc = window.getComputedStyle(p);
        if (pc.display === 'none' || pc.visibility === 'hidden') return false;
        p = p.parentNode;
      }
      return true;
    } catch (e) { return false; }
  }

  function findBtn() {
    var list = document.querySelectorAll('button,a,.btn,.retry-btn,[onclick]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === note || el === okBtn) continue;
      var t = (el.textContent || '').replace(/\s+/g, ' ');
      if (t.length > 0 && t.length < 50 && RE_BTN.test(t) && visible(el)) return el;
    }
    return null;
  }

  /* 오답이 있다고 알려 주는 화면 요소를 찾는다 (예: '❌ 오답 (3개)') */
  function findWrongHead() {
    var list = document.querySelectorAll('h1,h2,h3,h4,h5,div,p,span,b,strong');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === note || el === okBtn) continue;
      var t = (el.textContent || '').replace(/\s+/g, ' ');
      if (t.length > 60) continue;
      var m = RE_CNT.exec(t);
      if (!m) continue;
      var n = parseInt(m[1] || m[2], 10);
      if (n > 0 && visible(el)) return el;
    }
    return null;
  }

  function makeNote(html) {
    if (!note) {
      note = document.createElement('div');
      note.id = 'bnForceNote';
      note.setAttribute('style',
        'margin:10px 0 2px;padding:9px 10px;border-radius:12px;background:#fff3f1;' +
        'border:1px solid #f0b8ae;color:#c0392b;font-weight:800;font-size:13px;' +
        'line-height:1.55;text-align:center');
    }
    note.innerHTML = html;
    note.style.display = '';
    return note;
  }

  function place(el, after) {
    if (el.parentNode === after.parentNode && el.previousSibling === after) return;
    try { after.parentNode.insertBefore(el, after.nextSibling); } catch (e) {}
  }

  function stateA(btn) {
    armed = true;
    place(makeNote('⚠️ 아직 끝나지 않았어요 — 틀린 문제를 다시 풀어야 끝나요' +
      '<br><span style="font-weight:600;color:#7a7570;font-size:12px">' +
      '지금 창을 닫으면 오답을 풀지 않은 것으로 남아요</span>'), btn);
    if (okBtn) okBtn.style.display = 'none';
  }

  function stateB(head) {
    armed = true;
    place(makeNote('⚠️ 오답을 꼭 확인해야 끝나요' +
      '<br><span style="font-weight:600;color:#7a7570;font-size:12px">' +
      '아래 오답을 읽어 보고 버튼을 눌러 주세요</span>'), head);
    if (!okBtn) {
      okBtn = document.createElement('button');
      okBtn.id = 'bnForceOk';
      okBtn.type = 'button';
      okBtn.setAttribute('style',
        'display:block;width:100%;margin:8px 0 2px;padding:12px;border:none;border-radius:14px;' +
        'background:#2e7d32;color:#fff;font-weight:800;font-size:14px;cursor:pointer;' +
        'font-family:inherit');
      okBtn.innerHTML = '오답을 모두 확인했어요 ✅';
      okBtn.onclick = function () {
        confirmed = true;
        armed = false;
        if (note) note.style.display = 'none';
        okBtn.disabled = true;
        okBtn.innerHTML = '확인했어요 👍';
        okBtn.style.background = '#9e9e9e';
      };
    }
    okBtn.style.display = '';
    place(okBtn, note);
  }

  function clear() {
    armed = false;
    if (note) note.style.display = 'none';
    if (okBtn) okBtn.style.display = 'none';
  }

  function scan() {
    var btn = findBtn();
    if (btn) { stateA(btn); sawWrong = true; return; }

    var head = findWrongHead();
    if (head) {
      if (!sawWrong) { sawWrong = true; confirmed = false; }
      if (confirmed) { clear(); if (okBtn) okBtn.style.display = ''; return; }
      stateB(head);
      return;
    }
    sawWrong = false;
    confirmed = false;
    clear();
  }

  window.addEventListener('beforeunload', function (e) {
    if (!armed) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  });

  function start() {
    scan();
    setInterval(scan, 800);
    document.addEventListener('click', function () { setTimeout(scan, 150); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
