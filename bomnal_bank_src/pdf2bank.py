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

    words  = build_vocab(pdf)
    joinln = make_join(words)
    joinall = lambda ps: __import__('functools').reduce(joinln, ps, '')

    # 정답지 시작 지점. 두 가지 형식을 본다.
    #   (가) 따로 쪽을 잡는 "(정답지)"          (나) 문서 끝 각주  "1) ⑤: 해설..."
    # clean() 이 "(정답지)" 줄을 지우므로 경계는 반드시 손대기 전 원문에서 찾는다.
    raw = '\n'.join(pages).replace('\r', '').split('\n')
    cut = next((i for i, l in enumerate(raw) if '(정답지)' in l.replace(' ', '')), None)
    if cut is None:
        cut = next((i for i, l in enumerate(raw)
                    if re.match(r'^\s*1\s*\)\s*[①②③④⑤]\s*[:：]', l)), len(raw))
    lines = clean('\n'.join(raw[:cut]))
    key   = '\n'.join(clean('\n'.join(raw[cut:])))

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
        done = lambda t: ']' in t or re.search(r'[?？]\s*\d*\s*\)?\s*$', t)
        stem, j = head, 0
        while not done(stem) and j < len(chunk) and j < 3:
            t = chunk[j].strip()
            if not t: break
            stem = joinln(stem, t); j += 1
        stem = re.sub(r'\s*\[[^\]]*\]?\s*$', '', stem)      # [1-1] 꼬리표
        stem = re.sub(r'\s*\d+\s*\)\s*$', '', stem).strip()  # 각주 번호 1)

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

    # "12 번 - ③", "1번-④" (객관식) 과 "1 번 - reminded her of ..." (서술형),
    # 그리고 각주형 "1) ⑤:" 를 모두 받는다.
    pat = (r'(?:(?<=\n)|^)\s*(\d{1,3})\s*'
           r'(?:번\s*[-–—]\s*|\)\s*(?=[①②③④⑤]))')
    hits = list(re.finditer(pat, key))
    keys = {}
    for n, m in enumerate(hits):
        stop = hits[n+1].start() if n+1 < len(hits) else len(key)
        seg = key[m.end():stop]

        mark = ''
        head = seg.lstrip()
        if head[:1] in CIRC and head[:1]:          # 객관식: 동그라미 번호
            mark = head[0]
            seg = head[1:].lstrip(':： ')
            cut2 = re.search(r'\n\s*①', seg)      # 각주형은 선택지 번역이 뒤에 붙는다
            if cut2: seg = seg[:cut2.start()]
            body = joinall([x.strip() for x in seg.split('\n') if x.strip()])
        else:                                      # 서술형: 답 자체가 글이다
            body = joinall([x.strip() for x in seg.split('\n') if x.strip()])
            parts = re.split(r'\s{3,}', body, 1)   # 답과 해설은 넓은 공백으로 갈린다
            if len(parts) == 2 and 0 < len(parts[0]) <= 200:
                mark, body = parts[0].strip(), parts[1].strip()
            else:
                mark, body = body.strip(), ''
        keys[int(m.group(1))] = (mark, body)
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
