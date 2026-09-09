#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""APEX 형식 문제지 PDF → 문항 JSON

  python3 pdf2bank.py <파일.pdf> <출력.json>

겪었던 함정은 README 의 "PDF 에서 문제를 뽑는 법" 을 보세요.
"""
import re, json, sys, subprocess, tempfile
from pathlib import Path
from pypdf import PdfReader

CIRC = '①②③④⑤'
HAN  = r'[가-힣]'
JUNK = re.compile(r'^\s*(프리미엄고등관|APEX|-\s*\d+\s*-|\d+\s*-\s*$|\(정답지\).*)\s*$')
STRIP= re.compile(r'[0-9\s\-–—]|프리미엄고등관|APEX|[()]|\d단원|\(정답지\)')

def columns(pdf, page, width):
    """좌·우 단을 따로 뽑아 이어붙인다. 한 번에 뽑으면 두 단이 섞인다."""
    out = []
    for x in (0, width/2 - 3):
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tf:
            subprocess.run(['pdftotext', '-f', str(page), '-l', str(page),
                            '-x', str(int(x)), '-y', '0',
                            '-W', str(int(width/2 + 5)), '-H', '2000',
                            '-layout', str(pdf), tf.name], check=True)
            out.append(Path(tf.name).read_text(encoding='utf-8'))
            Path(tf.name).unlink()
    return '\n'.join(out)

def build_vocab(pdf):
    """pypdf 는 한글 낱말 사이를 두 칸 이상 띄운다 → 낱말 사전을 만든다."""
    raw = '\n'.join((p.extract_text() or '') for p in PdfReader(str(pdf)).pages)
    words = set()
    for line in raw.split('\n'):
        for tok in re.split(r'\s{2,}', line):
            words.update(re.findall(HAN + '+', tok.strip()))
    return words

def make_join(words):
    def joinln(a, b):
        if not a: return b
        if not b: return a
        A = (re.findall(HAN + r'+$', a) or [''])[0]
        B = (re.findall('^' + HAN + '+', b) or [''])[0]
        if not A or not B:            return a + ' ' + b   # 영어는 띄운다
        if len(A) == 1 or len(B) == 1: return a + b        # 한 글자는 잘린 낱말
        if (A + B) in words:           return a + b        # 붙이면 아는 낱말
        if A in words and B in words:  return a + ' ' + b  # 둘 다 온전한 낱말
        return a + b
    return joinln

def clean(txt):
    out = []
    for ln in txt.replace('\r', '').split('\n'):
        if JUNK.match(ln): continue
        if ln.strip() and not STRIP.sub('', ln).strip(): continue
        out.append(ln.rstrip())
    return out

def parse(pdf):
    rd = PdfReader(str(pdf))
    width = float(rd.pages[0].mediabox.width)
    pages = [columns(pdf, i, width) for i in range(1, len(rd.pages) + 1)]
    keyfrom = next((i for i, t in enumerate(pages) if '(정답지)' in t.replace(' ', '')), len(pages))

    words  = build_vocab(pdf)
    joinln = make_join(words)
    joinall = lambda ps: __import__('functools').reduce(joinln, ps, '')

    lines = clean('\n'.join(pages[:keyfrom]))
    key   = '\n'.join(clean('\n'.join(pages[keyfrom:])))

    starts, want = [], 1
    for i, ln in enumerate(lines):
        m = re.match(r'^\s*(\d{1,3})\.\s+(\S.*)$', ln)
        if m and int(m.group(1)) == want:
            starts.append((i, want, m.group(2).strip())); want += 1

    def para(ls):
        buf, out = [], []
        for l in ls:
            t = l.strip()
            if t: buf.append(t)
            elif buf: out.append(joinall(buf)); buf = []
        if buf: out.append(joinall(buf))
        return '\n\n'.join(out)

    qs = []
    for k, (i, no, head) in enumerate(starts):
        end = starts[k+1][0] if k+1 < len(starts) else len(lines)
        chunk = lines[i+1:end]
        stem, j = head, 0
        while ']' not in stem and j < len(chunk) and j < 3:
            t = chunk[j].strip()
            if not t: break
            stem = joinln(stem, t); j += 1
        stem = re.sub(r'\s*\[[^\]]*\]?\s*$', '', stem).strip()

        rest = chunk[j:]
        underline = '밑줄 친 부분 중' in stem     # ①~⑤ 가 지문 안에 박힌 유형
        oi = None if underline else next(
            (n for n, l in enumerate(rest) if l.strip().startswith('①')), None)
        if oi is not None and not all(c in ' '.join(rest[oi:]) for c in CIRC):
            oi = None

        opts = []
        if oi is not None:
            blob = ' '.join(l.strip() for l in rest[oi:] if l.strip())
            pos = [p for p, ch in enumerate(blob) if ch in CIRC]
            opts = [re.sub(r'\s+', ' ', blob[p:(pos[n+1] if n+1 < len(pos) else len(blob))]).strip()
                    for n, p in enumerate(pos)]
        qs.append({'no': no, 'stem': stem,
                   'passage': para(rest if oi is None else rest[:oi]),
                   'extra': '', 'options': opts, 'answer': '', 'explain': ''})

    hits = list(re.finditer(r'(\d{1,3})\s*번\s*[-–—]\s*([①②③④⑤])', key))
    keys = {}
    for n, m in enumerate(hits):
        stop = hits[n+1].start() if n+1 < len(hits) else len(key)
        keys[int(m.group(1))] = (m.group(2),
            joinall([x.strip() for x in key[m.end():stop].split('\n') if x.strip()]))
    for q in qs:
        if q['no'] in keys:
            q['answer'], q['explain'] = keys[q['no']]
    return qs

if __name__ == '__main__':
    pdf, out = Path(sys.argv[1]), Path(sys.argv[2])
    qs = parse(pdf)
    def tidy(t):
        t = t.replace('’', "'").replace('“', '"').replace('”', '"')
        return '\n\n'.join(re.sub(r'[ \t]+', ' ', p).strip() for p in t.split('\n\n')).strip()
    for q in qs:
        q['stem'] = tidy(q['stem']); q['passage'] = tidy(q['passage'])
        q['options'] = [tidy(o) for o in q['options']]; q['explain'] = tidy(q['explain'])
    out.write_text(json.dumps(qs, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(qs)}문항 · 정답 {sum(1 for q in qs if q["answer"])}개 · 해설 {sum(1 for q in qs if q["explain"])}개')
    bad = [q['no'] for q in qs if not q['answer']]
    print('정답 없음:', bad or '없음')
    print('선택지 5개 아님:', [(q['no'], len(q['options'])) for q in qs if q['options'] and len(q['options']) != 5] or '없음')
    print('선택지 없음:', [q['no'] for q in qs if not q['options']] or '없음')
