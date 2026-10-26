#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""app_shell.html + bank.json  ->  아티팩트용 페이지 (claude.ai 저장소 사용)

- 맨 앞 <!DOCTYPE>/<html>/<head> 는 뺀다 (아티팩트가 씌워 준다)
- 선생님 코드 입력(gate)은 뺀다 (아티팩트 자체가 본인만 열린다)
- Firebase 공유 저장소 → 아티팩트 db 저장소로 갈아끼운다
"""
import json, re
from datetime import datetime
from pathlib import Path

HERE = Path("/home/claude/bank2")
shell = (HERE / "app_shell.html").read_text(encoding="utf-8")
bank = (HERE / "bank.json").read_text(encoding="utf-8")
folders = (HERE / "folders.json").read_text(encoding="utf-8")

# ---- 1. 본문만 잘라낸다 ----
core = shell[shell.index("<title>봄날"): shell.rindex("</body>")]

# ---- 2. 코드 입력 화면 제거 ----
g0 = core.index('<div id="gate"')
g1 = core.index('<div class="wrap">')
core = core[:g0] + core[g1:]

# ---- 3. 안내 문구 ----
core = core.replace(
    "저장은 이 브라우저에 남습니다.",
    "저장은 자동으로 됩니다.")

# ---- 4. Firebase 블록 → 아티팩트 저장소 ----
NEW_SYNC = r"""<script>
/* ========= 저장 (claude.ai 아티팩트 저장소) =========
   학생 목록과 오답 체크는 아티팩트 저장소에 남는다. 이 브라우저(localStorage)는 거들 뿐이라
   저장소를 못 쓰는 상황에서도 오답노트 자체는 그대로 돌아간다.
   학생 한 명 = 문서 하나(students/<id>), 자료 이름·숨김은 meta/main.
   한 문서가 256KB 를 넘으면 안 되므로 학생별로 쪼개 둔 것이다.
   폴더 접힘·고른 자료 같은 화면 설정은 예전처럼 이 브라우저에만 둔다. */
(function(){
  const msg = (t, bad) => { const el = document.getElementById('syncMsg');
    if(el){ el.textContent = t; el.style.color = bad ? 'var(--warn)' : 'var(--pick)'; } };

  /* 파일 내려받기.
     아티팩트 안에서는 <a download> 가 통하지 않는다 (아무 일도 안 일어난다).
     downloads 로 내보내고, 그게 없을 때만 예전 방식으로 떨어진다. */
  window.__bankSave = async function(filename, text, mime){
    const note = t => { const el = document.getElementById('printMsg'); if(el) el.textContent = t; };
    try{
      if(typeof claude !== 'undefined' && claude.use){
        const d = await claude.use('downloads');
        if(d){
          await d.save({filename: filename, data: new Blob([text], {type: mime})});
          note('내려받았습니다: ' + filename);
          return true;
        }
      }
    }catch(e){
      if(e && e.code === 'declined'){ note('내려받기를 취소했습니다.'); return false; }
      note('내려받지 못했습니다. 다시 눌러 주세요.');
      return false;
    }
    try{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], {type: mime}));
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      return true;
    }catch(e){ note('내려받지 못했습니다.'); return false; }
  };

  // 체크는 숫자 배열만, 빈 자료는 뺀다
  function cleanMarks(src){
    const out = {};
    Object.keys(src || {}).forEach(c => {
      const a = [...new Set((src[c] || []).map(Number).filter(Number.isFinite))].sort((x,y)=>x-y);
      if(a.length) out[c] = a;
    });
    return out;
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  let DB = null, ids = {}, lastSent = {}, lastMeta = null,
      nextId = 1, timer = null, busy = false, again = false;

  function snapshotLocal(){
    const out = {};
    (store.students || []).forEach((n, i) => {
      if(typeof n !== 'string' || !n.trim()) return;
      out[n] = {name: n, order: i, marks: cleanMarks((store.marks || {})[n])};
    });
    return out;
  }
  function mintId(){ return 's' + (nextId++); }

  async function flush(){
    if(!DB || busy){ again = !!DB; return; }
    busy = true;
    try{
      msg('☁ 저장 중…');
      const now = snapshotLocal();
      for(const n of Object.keys(now)){                 // 바뀐 학생만 쓴다
        if(!ids[n]) ids[n] = mintId();
        if(same(now[n], lastSent[n])) continue;
        await DB.doc('students/' + ids[n]).set(now[n]);
        lastSent[n] = now[n];
      }
      for(const n of Object.keys(lastSent)){            // 지운 학생
        if(now[n]) continue;
        if(ids[n]) await DB.doc('students/' + ids[n]).delete();
        delete lastSent[n]; delete ids[n];
      }
      const meta = {titles: store.titles || {}, hidden: store.hidden || [],
                    ids: ids, nextId: nextId};
      if(!same(meta, lastMeta)){
        await DB.doc('meta/main').set(meta);
        lastMeta = meta;
      }
      msg('☁ 저장됨 ' + new Date().toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}));
    }catch(e){
      msg('☁ 저장 실패 — 이 브라우저에는 남아 있습니다', true);
    }finally{
      busy = false;
      if(again){ again = false; setTimeout(flush, 300); }
    }
  }

  // save() 가 부른다
  window.__bankSyncQueue = function(){
    if(!DB) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 800);
  };

  (async function(){
    if(typeof claude === 'undefined' || !claude.use){
      msg('이 브라우저에만 저장됩니다', true); return;
    }
    msg('☁ 저장소 여는 중…');
    let db = null;
    try{ db = await claude.use('db'); }catch(e){}
    if(!db){ msg('이 브라우저에만 저장됩니다', true); return; }
    DB = db;
    try{
      const [snap, metaSnap] = await Promise.all([
        DB.collection('students').get(),
        DB.doc('meta/main').get()
      ]);
      const meta = metaSnap.exists ? (metaSnap.data() || {}) : {};

      if(snap.empty){
        // 저장소가 비었다 → 이 브라우저에 있던 기록을 한 번 올린다
        ids = {}; nextId = 1;
        await flush();
        return;
      }

      const rows = snap.docs.map(d => Object.assign({_id: d.id}, d.data()))
                            .filter(r => typeof r.name === 'string' && r.name.trim())
                            .sort((a, b) => (a.order || 0) - (b.order || 0));
      ids = {};
      store.students = [];
      store.marks = {};
      rows.forEach(r => {
        if(store.marks[r.name] !== undefined) return;   // 같은 이름이 둘이면 앞의 것만
        store.students.push(r.name);
        store.marks[r.name] = cleanMarks(r.marks);
        ids[r.name] = r._id;
      });
      store.titles = meta.titles || {};
      store.hidden = meta.hidden || [];
      nextId = Math.max(Number(meta.nextId) || 1,
                        ...Object.values(ids).map(s => (parseInt(String(s).slice(1), 10) || 0) + 1));
      lastSent = snapshotLocal();
      lastMeta = {titles: store.titles, hidden: store.hidden, ids: ids, nextId: nextId};
      try{ localStorage.setItem(KEY, JSON.stringify(store)); }catch(e){}
      if(!store.students.includes(cur)) cur = store.students[0] || null;
      rebuild(); drawAll(); drawSrcList();
      msg('☁ 불러왔습니다 · 자동 저장');
    }catch(e){
      msg('☁ 저장소를 못 읽었습니다 — 이 브라우저 기록으로 씁니다', true);
    }
  })();
})();
</script>"""

f0 = core.index('<script type="module">')
f1 = core.index("</script>", f0) + len("</script>")
core = core[:f0] + NEW_SYNC + core[f1:]

# ---- 4-2. 내려받기를 downloads 로 ----
OLD_EXPORT = """$('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(store,null,1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '봄날_오답기록_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
};"""
NEW_EXPORT = """$('exportBtn').onclick = () => {
  __bankSave('봄날_오답기록_' + new Date().toISOString().slice(0,10) + '.json',
             JSON.stringify(store, null, 1), 'application/json');
};"""
OLD_DL = """$('dl').onclick = () => {
  const blob = new Blob([noteHtml()], {type:'text/html;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '오답노트_' + cur + '_' + new Date().toISOString().slice(0,10) + '.html';
  document.body.appendChild(a); a.click(); a.remove();
};"""
NEW_DL = """$('dl').onclick = () => {
  __bankSave('오답노트_' + cur + '_' + new Date().toISOString().slice(0,10) + '.html',
             noteHtml(), 'text/html;charset=utf-8');
};"""
for old, new in ((OLD_EXPORT, NEW_EXPORT), (OLD_DL, NEW_DL)):
    assert old in core, old[:40]
    core = core.replace(old, new, 1)

# ---- 5. 자리표시자 ----
n = len(json.loads(bank))
q = sum(len(f["questions"]) for f in json.loads(bank))
stamp = f"{datetime.now():%Y-%m-%d %H:%M} · 자료 {n}개 · 문항 {q}개"
core = (core.replace("__BUILDSTAMP__", stamp)
            .replace("__FOLDERS__", folders)
            .replace("__BANK__", bank))

out = HERE / "bank_artifact.html"
out.write_text(core, encoding="utf-8")

# ---- 자체 점검 ----
import sys
body = core[core.rindex("<script>") + 8:]
need = ["drawSources", "drawSrcList", "drawGrid", "buildSheet", "noteHtml", "rebuild", "load", "save"]
gone = [f for f in need if ("function " + f) not in core]
left = [t for t in ("__BANK__", "__BUILDSTAMP__", "__FOLDERS__") if t in core]
print(f"만들었습니다: {out.name} ({out.stat().st_size/1048576:.2f} MB)")
print("자료", n, "· 문항", q)
print("빠진 함수:", gone or "없음")
print("남은 자리표시자:", left or "없음")
print("DOCTYPE 남음:", "<!DOCTYPE" in core)
print("firebase 남음:", "firebasejs" in core)
print("gate 남음:", 'id="gate"' in core)
if gone or left:
    sys.exit("점검 실패")
