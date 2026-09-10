#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""한글(.hwp 5.0) 에서 글자만 뽑는다.   python3 hwp2txt.py 파일.hwp > out.txt

hwp 는 OLE 복합문서다. BodyText/SectionN 이 zlib 로 눌려 있고,
그 안은 (태그·수준·길이) 레코드가 이어진다. 글자는 태그 67(PARA_TEXT) 에
UTF-16LE 로 들어 있다.
"""
import sys, zlib, struct
import olefile

PARA_TEXT = 67
# 제어문자. 8글자를 차지하는 것과 1글자만 차지하는 것이 있다.
WIDE = {1,2,3,11,12,14,15,16,17,18,21,22,23}       # 확장·인라인 제어 (8 wchar)
INLINE = {4,5,6,7,8,9,19,20}                        # 인라인 제어 (8 wchar)
BREAKS = {10: '\n', 13: '\n'}                       # 줄바꿈·문단끝

def records(buf):
    i, n = 0, len(buf)
    while i + 4 <= n:
        (h,) = struct.unpack_from('<I', buf, i); i += 4
        tag, size = h & 0x3FF, (h >> 20) & 0xFFF
        if size == 0xFFF:
            (size,) = struct.unpack_from('<I', buf, i); i += 4
        yield tag, buf[i:i+size]
        i += size

def para_text(data):
    out, k, n = [], 0, len(data) // 2
    for _ in range(n):
        if k >= n: break
        (c,) = struct.unpack_from('<H', data, k*2)
        if c in BREAKS:
            out.append(BREAKS[c]); k += 1
        elif c in WIDE or c in INLINE:
            k += 8                                   # 표·그림 등은 건너뛴다
        elif c < 32:
            k += 1
        else:
            out.append(chr(c)); k += 1
    return ''.join(out)

def extract(path):
    ole = olefile.OleFileIO(path)
    head = ole.openstream('FileHeader').read()
    compressed = bool(head[36] & 1)
    names = sorted((s for s in ole.listdir() if s[0] == 'BodyText'),
                   key=lambda s: int(''.join(ch for ch in s[1] if ch.isdigit()) or 0))
    parts = []
    for name in names:
        raw = ole.openstream(name).read()
        if compressed:
            raw = zlib.decompress(raw, -15)
        for tag, data in records(raw):
            if tag == PARA_TEXT:
                parts.append(para_text(data))
    ole.close()
    return '\n'.join(parts)

if __name__ == '__main__':
    sys.stdout.write(extract(sys.argv[1]))
