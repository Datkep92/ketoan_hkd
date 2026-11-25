#!/usr/bin/env python3
"""Kiểm tra nhanh khung index.html và ba tệp js/*.js: cú pháp và vài bất biến.

Chạy: python3 Scripts/check_app.py [đường-dẫn-index.html]

Việc kiểm tra chỉ đọc, không sửa tệp. Không cần Node.
"""
import os
import re
import sys

DEFAULT = 'index.html'


def read_text(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def script_body(html, base):
    srcs = re.findall(r'<script\s+src="([^"]+)"', html)
    if not srcs:
        raise SystemExit('Không tìm thấy thẻ <script src> trong index.html')
    parts = []
    for src in srcs:
        path = os.path.normpath(os.path.join(os.path.dirname(base), src))
        if not os.path.isfile(path):
            raise SystemExit('Thiếu tệp script: ' + src)
        parts.append(read_text(path))
    return '\n'.join(parts), srcs


def check_syntax(code):
    """Bỏ qua chuỗi, chú thích, regex rồi kiểm tra ngoặc có khớp không."""
    errs = []
    i, n = 0, len(code)
    stack = []
    line = 1
    quote = None
    prev = ''
    while i < n:
        ch = code[i]
        if ch == '\n':
            line += 1
        if quote:
            if ch == '\\':
                i += 2
                continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if code.startswith('//', i):
            j = code.find('\n', i)
            i = n if j < 0 else j
            continue
        if code.startswith('/*', i):
            j = code.find('*/', i + 2)
            if j < 0:
                errs.append('dòng %d: chú thích chưa đóng' % line)
                break
            line += code.count('\n', i, j)
            i = j + 2
            continue
        if ch in '"\'`':
            quote = ch
            i += 1
            continue
        if ch == '/' and prev not in ')]}' and not (prev.isalnum() or prev == '_'):
            j = i + 1
            closed = False
            in_class = False
            while j < n:
                cj = code[j]
                if cj == '\\':
                    j += 2
                    continue
                if cj == '\n':
                    break
                if in_class:
                    if cj == ']':
                        in_class = False
                elif cj == '[':
                    in_class = True
                elif cj == '/':
                    closed = True
                    break
                j += 1
            if closed:
                i = j + 1
                prev = '/'
                continue
        if ch in '([{':
            stack.append((ch, line))
        elif ch in ')]}':
            pairs = {')': '(', ']': '[', '}': '{'}
            if not stack or stack[-1][0] != pairs[ch]:
                errs.append('dòng %d: %s không khớp' % (line, ch))
            else:
                stack.pop()
        if not ch.isspace():
            prev = ch
        i += 1
    if quote:
        errs.append('chuỗi chưa đóng: %s' % quote)
    for opener, ln in stack:
        errs.append('dòng %d: %s chưa đóng' % (ln, opener))
    return errs


def check_invariants(html, code, srcs):
    """Vài bất biến dễ vỡ khi sửa tay."""
    errs = []
    if 'render(); render();' in code:
        errs.append('có chỗ gọi render() hai lần liền nhau')
    for need in ['function taxCalc(', "case 'printTax'", 'DEFAULT_POLICY', 'function render()', 'function go(']:
        if need not in code:
            errs.append('thiếu trong JS: ' + need)
    for need in ['id="app"', 'id="sheet"', 'id="print"', 'id="toast"', 'id="tabs"',
                 'rel="stylesheet"', 'lang="vi"']:
        if need not in html:
            errs.append('thiếu trong index.html: ' + need)
    want = ['js/core.js', 'js/views.js', 'js/actions.js']
    if srcs != want:
        errs.append('thứ tự script không đúng: ' + ', '.join(srcs))
    if 'indexedDB' not in code:
        errs.append('thiếu phần lưu bằng IndexedDB')
    if 'localStorage' not in code:
        errs.append('thiếu phần lưu dự phòng bằng localStorage')
    if 'không thay thế hóa đơn điện tử' not in code:
        errs.append('thiếu câu giới hạn trên phiếu in')
    return errs


def main():
    path_used = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    html = read_text(path_used)
    code, srcs = script_body(html, path_used)
    errs = check_syntax(code) + check_invariants(html, code, srcs)
    print('%s: %d byte; JS: %d byte / %d dòng (%s)' % (
        path_used, len(html.encode('utf-8')), len(code.encode('utf-8')),
        code.count('\n') + 1, ', '.join(srcs)))
    if errs:
        for e in errs:
            print('LỖI: ' + e)
        return 1
    print('Không thấy lỗi.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
