# -*- coding: utf-8 -*-
"""너른터 1과 어법 PDF → 문항 JSON"""
import re, json, sys
from pathlib import Path

SCR = Path(sys.argv[1])
CIRC = '①②③④⑤'

JUNK = re.compile(
    r'^\s*(프리미엄고등관|APEX|-\s*\d+\s*-|\d+\s*-\s*$|공통영어2\s*YBM.*|.*1단원\s*$|\(정답지\).*)\s*$')

STRIP = re.compile(r'[0-9\s\-–—]|프리미엄고등관|APEX|공통영어2|YBM|김은형|[()]|1단원|\(정답지\)')

HAN = re.compile(r'[\uac00-\ud7a3]')
VOCAB = set(json.loads((SCR / 'vocab.json').read_text(encoding='utf-8')))

def joinln(a, b):
    """이 PDF 는 한글을 글자 단위로 줄바꿈한다. 낱말 사전으로 붙일지 띄울지 정한다.
    사전은 pypdf 가 낱말 사이를 두 칸 띄우는 성질을 이용해 뽑아둔 것."""
    if not a: return b
    if not b: return a
    A = (re.findall(r'[\uac00-\ud7a3]+$', a) or [''])[0]
    B = (re.findall(r'^[\uac00-\ud7a3]+', b) or [''])[0]
    if not A or not B:                 # 한쪽이 한글이 아니면 영어식으로 띄운다
        return a + ' ' + b
    if len(A) == 1 or len(B) == 1:     # 한 글자 조각은 잘린 낱말로 본다
        return a + b
    if (A + B) in VOCAB:               # 붙이면 아는 낱말이 된다
        return a + b
    if A in VOCAB and B in VOCAB:      # 둘 다 온전한 낱말이다
        return a + ' ' + b
    return a + b

def joinall(parts):
    out = ''
    for t in parts:
        out = joinln(out, t)
    return out

def clean(txt):
    out = []
    for ln in txt.replace('\r', '').split('\n'):
        if JUNK.match(ln):
            continue
        if ln.strip() and not STRIP.sub('', ln).strip():   # 숫자·머리말만 남은 줄
            continue
        out.append(ln.rstrip())
    return out

# ── 본문
lines = clean((SCR / 'body.txt').read_text(encoding='utf-8'))

starts = []
for i, ln in enumerate(lines):
    m = re.match(r'^\s*(\d{1,3})\.\s+(\S.*)$', ln)
    if m:
        starts.append((i, int(m.group(1)), m.group(2).strip()))

# 번호가 1씩 커지는 것만 진짜 문항 시작으로 본다 (지문 속 숫자 오인 방지)
real, want = [], 1
for s in starts:
    if s[1] == want:
        real.append(s); want += 1
print(f'문항 시작 {len(real)}개 (기대 50)', file=sys.stderr)

def para(ls):
    buf, out = [], []
    for l in ls:
        t = l.strip()
        if t:
            buf.append(t)
        elif buf:
            out.append(joinall(buf)); buf = []
    if buf: out.append(joinall(buf))
    return '\n\n'.join(out)

qs = []
for k, (i, no, head) in enumerate(real):
    end = real[k+1][0] if k+1 < len(real) else len(lines)
    chunk = lines[i+1:end]

    # 발문: 첫 줄 + [1-1] 이 나올 때까지
    stem, j = head, 0
    while ']' not in stem and j < len(chunk) and j < 3:
        t = chunk[j].strip()
        if not t: break
        stem = joinln(stem, t); j += 1
    stem = re.sub(r'\s*\[[^\]]*\]?\s*$', '', stem).strip()

    rest = chunk[j:]
    # 선택지: 줄 맨 앞이 ①~⑤ 인 줄부터
    # 선택지는 ① 로 시작하는 줄부터. 밑줄형 문제는 ①~⑤ 가 지문 안에 박혀 있어서
    # 줄바꿈으로 ④⑤ 가 줄 앞에 오는데, 그걸 선택지로 오인하면 안 된다.
    underline = '밑줄 친 부분 중' in stem        # 어법상 틀린 것 고르기 = 표시가 지문 안에 있음
    oi = None if underline else next(
        (n for n, l in enumerate(rest) if l.strip().startswith('①')), None)
    if oi is not None:
        tail = ' '.join(l.strip() for l in rest[oi:])
        if not all(c in tail for c in CIRC):     # ①~⑤ 가 다 있어야 진짜 선택지
            oi = None
    body_ls = rest if oi is None else rest[:oi]
    opt_ls  = [] if oi is None else rest[oi:]

    passage = para(body_ls)
    opts = []
    if opt_ls:
        blob = ' '.join(l.strip() for l in opt_ls if l.strip())
        pos = [p for p, ch in enumerate(blob) if ch in CIRC]
        for n, p in enumerate(pos):
            e = pos[n+1] if n+1 < len(pos) else len(blob)
            opts.append(re.sub(r'\s+', ' ', blob[p:e]).strip())
    qs.append({'no': no, 'stem': stem, 'passage': passage, 'extra': '',
               'options': opts, 'answer': '', 'explain': ''})

# ── 정답지  ("1번-④" 와 "46 번 - ⑤" 두 형식)
key = (SCR / 'key.txt').read_text(encoding='utf-8')
key = '\n'.join(clean(key))
hits = list(re.finditer(r'(\d{1,3})\s*번\s*[-–—]\s*([①②③④⑤])', key))
keys = {}
for n, m in enumerate(hits):
    stop = hits[n+1].start() if n+1 < len(hits) else len(key)
    keys[int(m.group(1))] = {
        'answer': m.group(2),
        'explain': joinall([x.strip() for x in key[m.end():stop].split('\n') if x.strip()])
    }
print(f'정답 {len(keys)}개', file=sys.stderr)

for q in qs:
    k = keys.get(q['no'])
    if k: q['answer'], q['explain'] = k['answer'], k['explain']

# 원본 PDF 결함 보정: 20번 지문이 쪽 경계에서 한 구절 통째로 빠져 있다.
# 같은 지문을 쓰는 21·23번과 20번 해설("② 'what'을 that(which)로")로 복원.
for q in qs:
    if q['no'] == 20 and 'electronics\n\nhe found' in q['passage'].replace('  ', ' '):
        q['passage'] = q['passage'].replace(
            'fascinated with electronics',
            'fascinated with electronics since childhood. He would often do '
            'experiments with discarded electronics ② what', 1)
        q['passage'] = re.sub(r'\n\n\s*he found', ' he found', q['passage'])

CANON = [
 '(A), (B), (C)의 각 네모 안에서 어법에 맞는 표현으로 가장 적절한 것은?',
 '다음 글의 제목으로 가장 적절한 것은?',
 '다음 글의 주제로 가장 적절한 것은?',
 '다음 글의 요지로 가장 적절한 것은?',
 '다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?',
 '다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?',
 '다음 글에서 밑줄 친 부분이 의미하는 바로 가장 적절한 것은?',
]
CANON_KEY = {re.sub(r'\s+', '', c): c for c in CANON}
unmatched = []
for q in qs:
    k = re.sub(r'\s+', '', q['stem'])
    if k in CANON_KEY: q['stem'] = CANON_KEY[k]
    else: unmatched.append((q['no'], q['stem']))
print('표준 발문에 안 맞는 문항:', unmatched or '없음')

(SCR / 'parsed.json').write_text(json.dumps(qs, ensure_ascii=False, indent=1), encoding='utf-8')

# ── 점검
no_ans  = [q['no'] for q in qs if not q['answer']]
no_pass = [q['no'] for q in qs if len(q['passage']) < 80]
odd_opt = [(q['no'], len(q['options'])) for q in qs if q['options'] and len(q['options']) != 5]
inline  = [q['no'] for q in qs if not q['options']]
print('정답 없음:', no_ans or '없음')
print('지문 짧음:', no_pass or '없음')
print('선택지 5개 아님:', odd_opt or '없음')
print('선택지 없음(밑줄형):', inline)
