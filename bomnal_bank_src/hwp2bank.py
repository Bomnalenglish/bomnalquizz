#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""한글 기출문제집(.hwp) → 문항 JSON     python3 hwp2bank.py 파일.hwp out.json

APEX PDF 와 구조가 다르다.
  다음 글을 읽고 물음에 답하시오. [1과][학교]
   <지문 문단들 — 앞에 공백>
  <발문>                       ← 열 0 에서 시작, ? 나 시오. 로 끝남
   <정답>                      ← 발문 바로 다음 줄, 앞에 공백
  ① ... ② ...                 ← 선택지 (한 줄에 여러 개일 때도 있다)
한 세트의 지문을 여러 문항이 함께 쓴다. 문항 번호는 문서에 없으므로 차례대로 매긴다.
"""
import sys, re, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from hwp2txt import extract

CIRC = '①②③④⑤'
SETHDR = re.compile(r'^\s*다음(\s*글)?을\s*읽고,?\s*물음에 답하시오')
STEMEND = re.compile(r'(\?|시오\.|것은|것인가|고르시오|쓰시오|하시오)\s*$')
BLANK  = re.compile(r'^\s*정답\s*[:：]\s*_+\s*$')
TITLE  = re.compile(r'(내신기출문제|기출\s*-?\s*\d+제|[–—-]\s*\d+문항)')   # 문서 제목 줄

TAGS = re.compile(r'\s*(\[[^\]]*\]\s*)+$')       # 끝의 [1과][영신고]
TAIL = re.compile(r'\s*\([^)]*\)\s*$')            # 끝의 (단, ...) 설명

def is_stem(l):
    t = l.strip()
    if not t or l[:1] == ' ': return False          # 들여쓴 줄은 지문이나 정답
    if t[0] in CIRC: return False
    if t.startswith(('Q.', 'Q .', '<')): return False
    if not re.search(r'[가-힣]', t): return False    # 대화 지문 줄 오인 방지
    if re.match(r'^[A-Z][a-z]{0,6}\s*[:：]', t): return False   # G: / Man: 같은 대사
    if SETHDR.match(t): return False
    t = TAGS.sub('', t)
    return bool(STEMEND.search(t) or STEMEND.search(TAIL.sub('', t)))

def split_opts(text):
    pos = [i for i, c in enumerate(text) if c in CIRC]
    out = []
    for n, p in enumerate(pos):
        e = pos[n+1] if n+1 < len(pos) else len(text)
        s = re.sub(r'\s+', ' ', text[p:e]).strip()
        if s: out.append(s)
    return out

def parse(path):
    raw = [l.rstrip() for l in extract(path).split('\n')]
    lines = [l for l in raw if l.strip()]

    qs, passage, i, no = [], '', 0, 0
    while i < len(lines):
        L = lines[i]
        if SETHDR.match(L):                          # 새 지문 세트 시작
            j, buf = i + 1, []
            while j < len(lines) and not is_stem(lines[j]) and not SETHDR.match(lines[j]):
                t = lines[j].strip()
                if t and not BLANK.match(t) and not TITLE.search(t) and t[0] not in CIRC:
                    buf.append(t)
                j += 1
            passage = '\n\n'.join(buf)
            i = j; continue

        if is_stem(L):
            no += 1
            stem = TAGS.sub('', L.strip())
            j = i + 1
            answer = ''
            while j < len(lines) and TITLE.search(lines[j].strip()):
                j += 1                       # 발문과 정답 사이에 낀 문서 제목 줄
            # 정답은 발문 바로 다음의 들여쓴 줄이다 (선택지는 열 0 에서 시작한다)
            if j < len(lines) and lines[j][:1] == ' ' and not BLANK.match(lines[j]):
                answer = lines[j].strip(); j += 1

            # 세트 머리말 없이 지문이 정답 바로 뒤에 붙는 문서도 있다.
            # 선택지가 나오기 전의 글은 그 문항의 지문으로 본다.
            opts, pre, post = [], [], []
            while j < len(lines) and not is_stem(lines[j]) and not SETHDR.match(lines[j]):
                t = lines[j].strip()
                if BLANK.match(t) or TITLE.search(t): j += 1; continue
                if any(c in t for c in CIRC):
                    opts += split_opts(t)
                elif opts: post.append(t)
                else: pre.append(t)
                j += 1

            own = '\n\n'.join(pre)
            if len(own) >= 150:                    # 자기 지문이 있으면 그것을 쓴다
                use, extra = own, post
            else:
                use, extra = passage, pre + post

            qs.append({'no': no, 'stem': stem, 'passage': use,
                       'extra': '\n'.join(extra), 'options': opts,
                       'answer': answer, 'explain': ''})
            i = j; continue
        i += 1
    return qs

if __name__ == '__main__':
    qs = parse(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(qs, ensure_ascii=False, indent=1), encoding='utf-8')
    na = [q['no'] for q in qs if not q['answer']]
    np_ = [q['no'] for q in qs if len(q['passage']) < 80]
    odd = [(q['no'], len(q['options'])) for q in qs if q['options'] and len(q['options']) != 5]
    print(f"{len(qs)}문항 · 정답 {sum(1 for q in qs if q['answer'])}개")
    print('정답 없음:', na or '없음')
    print('지문 없음:', np_ or '없음')
    print('선택지 5개 아님:', odd[:12] or '없음', f'(총 {len(odd)})' if odd else '')
    print('선택지 없음(서술형):', [q['no'] for q in qs if not q['options']][:20])
