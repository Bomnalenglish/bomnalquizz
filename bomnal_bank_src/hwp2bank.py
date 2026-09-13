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
BLANK  = re.compile(r'^\s*(정답\s*[:：]\s*)?▶?\s*_{5,}\s*$')          # 답 쓰는 칸
TITLE  = re.compile(r'(내신기출문제|기출\s*-?\s*\d+제|[–—-]\s*\d+문항'
                    r'|^공통영어\d?\s*YBM\s*\([^)]*\)\s*\d*과?\s*[^가-힣]*$'
                    r'|^공통영어\d?\s*YBM'
                    r'|^PART\s*[ⅠⅡⅢⅣⅤⅥ]|정답\s*&\s*해설|\d{4}개정 교과서|전국 학력 평가 변형문제)')

TAGS = re.compile(r'\s*(\[[^\]]*\]\s*)+$')       # 끝의 [1과][영신고]
TAIL = re.compile(r'\s*\([^)]*\)\s*$')            # 끝의 (단, ...) 설명

EXPL   = re.compile(r'^\s*(※|√|참고\s*[:：]?|▶\s*[^\s_])')   # 해설 줄 (▶ ____ 는 답 쓰는 칸)
QPART  = re.compile(r'^\s*(\[\s*조건\s*\]|<\s*조건\s*>|Q\s*[.:：]|<\s*보기\s*>|\[\s*보기\s*\])')   # 문제에 속하는 부분
# 선택지 번호는 파일마다 ①②③ 과 ➀➁➂(모양만 비슷한 다른 글자) 가 섞인다. 하나로 맞춘다.
NUMFIX = str.maketrans('➀➁➂➃➄', '①②③④⑤')

ENSTEM = re.compile(r'^(Which|What|According to|Choose|Select|Why|How)\b.*'
                    r'\b(passage|statement|following|best|NOT|true|correct|appropriate|main|title|topic|purpose|author|context)\b.*\?\s*$')

def is_stem(l):
    t = l.strip()
    if not t or l[:1] == ' ': return False          # 들여쓴 줄은 지문이나 정답
    if t[0] in CIRC: return False
    if t.startswith(('Q.', 'Q .', '<')): return False
    if not re.search(r'[가-힣]', t):             # 한글 없는 줄은 영어 발문 말투일 때만
        return bool(ENSTEM.match(TAGS.sub('', t)))
    if re.match(r'^[A-Z][a-z]{0,6}\s*[:：]', t): return False   # G: / Man: 같은 대사
    if SETHDR.match(t): return False
    t = TAGS.sub('', t)
    return bool(STEMEND.search(t) or STEMEND.search(TAIL.sub('', t)))

ANSLINE = re.compile(r'^\s*[①②③④⑤](\s*[,·]\s*[①②③④⑤])*\s*([:：].*)?$')   # "④", "① :", "②,⑤ : 해설"
QWORD   = re.compile(r'^(Which|What|Why|How|When|Where|Who|According to)\b')

def stem_at(lines, i):
    """발문인가. 영어 발문은 단어 목록으로 가리면 놓치는 게 많아(9월 변형 4개),
    '바로 다음 줄이 정답 모양이거나 답 쓰는 칸' 인 의문문만 발문으로 본다.
    지문 속 의문문 다음엔 정답 번호가 오지 않으니 헷갈리지 않는다."""
    if is_stem(lines[i]): return True
    t = TAGS.sub('', lines[i].strip())
    if not t or t[0] in CIRC or re.search(r'[가-힣]', t): return False
    if not (QWORD.match(t) and t.endswith('?')): return False
    nxt = lines[i + 1] if i + 1 < len(lines) else ''
    # 다음 줄이 답 쓰는 칸(▶ ___)이면 앞 문제("다음 질문에 답을 쓰시오")에 딸린 질문이다
    return bool(ANSLINE.match(nxt))

def split_opts(text):
    pos = [i for i, c in enumerate(text) if c in CIRC]
    out = []
    for n, p in enumerate(pos):
        e = pos[n+1] if n+1 < len(pos) else len(text)
        s = re.sub(r'\s+', ' ', text[p:e]).strip()
        if s: out.append(s)
    return out

def parse(path):
    raw = [l.rstrip() for l in extract(path).translate(NUMFIX).split('\n')]
    lines = [l for l in raw if l.strip()]

    qs, passage, i, no = [], '', 0, 0
    while i < len(lines):
        L = lines[i]
        if SETHDR.match(L):                          # 새 지문 세트 시작
            j, buf = i + 1, []
            while j < len(lines) and not stem_at(lines, j) and not SETHDR.match(lines[j]):
                t = lines[j].strip()
                if t and not BLANK.match(t) and not TITLE.search(t) and t[0] not in CIRC:
                    buf.append(t)
                j += 1
            passage = '\n\n'.join(buf)
            i = j; continue

        if stem_at(lines, i):
            no += 1
            stem = TAGS.sub('', L.strip())
            j = i + 1
            answer = ''
            while j < len(lines) and TITLE.search(lines[j].strip()):
                j += 1                       # 발문과 정답 사이에 낀 문서 제목 줄
            # 정답은 발문 바로 다음의 들여쓴 줄이다 (선택지는 열 0 에서 시작한다)
            explain = []
            if j < len(lines) and (lines[j][:1] == ' ' or ANSLINE.match(lines[j])) and not BLANK.match(lines[j]):
                answer = re.sub(r'^(정답\s*[:：]|▶)\s*', '', lines[j].strip()); j += 1
                m = re.match(r'^([①②③④⑤](?:\s*[,·]\s*[①②③④⑤])*)\s*[:：]\s*(.*)$', answer)
                if m:                                   # 동그라미 뒤 콜론 → 뒤는 해설
                    answer = m.group(1).replace(' ', '')
                    explain = [m.group(2).strip()] if m.group(2).strip() else ['']
            elif (j + 1 < len(lines) and not stem_at(lines, j) and BLANK.match(lines[j + 1])
                  and lines[j].strip()[:1] not in CIRC):
                answer = lines[j].strip(); j += 1       # 서술형: 들여쓰기 없는 정답 줄 뒤에 답 쓰는 칸

            # 세트 머리말 없이 지문이 정답 바로 뒤에 붙는 문서도 있다.
            # 선택지가 나오기 전의 글은 그 문항의 지문으로 본다.
            opts, pre, post = [], [], []
            in_expl = bool(explain)                     # 정답 줄에 해설이 붙었으면 그 뒤도 해설
            while j < len(lines) and not stem_at(lines, j) and not SETHDR.match(lines[j]):
                t = lines[j].strip()
                if BLANK.match(t) or TITLE.search(t): j += 1; continue
                if t[:1] in CIRC and any(c in t for c in CIRC):
                    opts += split_opts(t); in_expl = False
                elif EXPL.match(t):
                    in_expl = True
                    explain.append(re.sub(r'^참고\s*[:：]\s*', '', t))
                elif QPART.match(t) or (not re.search(r'[가-힣]', t) and (
                        (QWORD.match(t) and t.endswith('?')) or re.match(r'^Please\b', t))):
                    in_expl = False
                    (post if opts else pre).append(t)
                elif in_expl:
                    explain.append(t)
                elif opts: post.append(t)
                else: pre.append(t)
                j += 1

            groups = []
            for o in opts:
                if o.startswith('①') or not groups: groups.append([o])
                else: groups[-1].append(o)
            if len(groups) > 1 and len(groups[-1]) == 5:
                explain += [' '.join(g) for g in groups[:-1]]
                opts = groups[-1]
            explain = [e for e in explain if e]

            own = '\n\n'.join(pre)
            upper = bool(re.match(r'^(윗글|위 ?글)', stem))   # 윗글 = 세트 지문
            if len(own) >= 150 and not (upper and passage):   # 자기 지문이 있으면 그것을 쓴다
                use, extra = own, post
            else:
                use, extra = passage, pre + post

            qs.append({'no': no, 'stem': stem, 'passage': use,
                       'extra': '\n'.join(extra), 'options': opts,
                       'answer': answer, 'explain': '\n'.join(explain)})
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
