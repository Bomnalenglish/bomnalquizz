#!/usr/bin/env python3
"""app_shell.html + bank.json + pdf.js  ->  ../bomnal_bank.html

사용법:  python3 build.py
"""
from pathlib import Path

HERE = Path(__file__).parent
OUT  = HERE.parent / "bomnal_bank.html"      # 저장소 루트 = GitHub Pages 공개 경로

shell = (HERE / "app_shell.html").read_text(encoding="utf-8")
bank  = (HERE / "bank.json").read_text(encoding="utf-8")
lib   = (HERE / "vendor" / "pdf.min.js").read_text(encoding="utf-8")
wrk   = (HERE / "vendor" / "pdf.worker.min.js").read_text(encoding="utf-8")

from datetime import datetime
import json as _json
_n = len(_json.loads(bank))
_q = sum(len(f["questions"]) for f in _json.loads(bank))
stamp = f'빌드 {datetime.now():%Y-%m-%d %H:%M} · 자료 {_n}개 · 문항 {_q}개'

html = (shell.replace("__PDFJS__", lib)
             .replace("__PDFWORKER__", wrk)
             .replace("__BUILDSTAMP__", stamp)
             .replace("__BANK__", bank))
OUT.write_text(html, encoding="utf-8")

# --- 자체 점검 -------------------------------------------------
import re, json, sys
body = html[html.rindex("<script>") + 8 : html.index("</script>", html.rindex("<script>"))]
ids  = sorted(set(re.findall(r"\$\('([a-zA-Z]+)'\)", body)))
missing = [i for i in ids if f'id="{i}"' not in html]
needed  = ["findGutter", "pdfToText", "loadPdf", "parseBody", "parseKey",
           "drawSrcList", "buildSheet", "noteHtml", "rebuild"]
gone    = [f for f in needed if f"function {f}" not in body]
data    = json.loads(bank)

print(f"만들었습니다: {OUT.name}  ({OUT.stat().st_size/1048576:.2f} MB)")
print(f"자료 {len(data)}개 · 문항 {sum(len(f['questions']) for f in data)}개")
print("없는 화면 요소:", missing or "없음")
print("빠진 함수:", gone or "없음")
print("남은 자리표시자:", [t for t in ("__BANK__","__PDFJS__","__PDFWORKER__","__BUILDSTAMP__") if t in html] or "없음")
if missing or gone:
    sys.exit("점검 실패 — 위 항목을 고쳐야 합니다.")
