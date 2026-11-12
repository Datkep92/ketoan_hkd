#!/usr/bin/env python3
"""Kiểm tra nhanh tệp app/quan-ly-hkd.html: cú pháp khối <script> và vài bất biến.

Chạy: python3 Scripts/check_app.py [đường-dẫn-tệp-html]

Việc kiểm tra chỉ đọc, không sửa tệp. Không cần Node vì máy không có.
"""
import re
import sys

DEFAULT = 'app/quan-ly-hkd.html'


def read_html(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def script_body(html):
    m = re.search(r'<script>(.*)</script>', html, re.S)
    if not m:
        raise SystemExit('Không tìm thấy khối <script> trong ' + path_used)
    return m.group(1)


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


def check_invariants(html, code):
    """Vài bất biến dễ vỡ khi sửa tay."""
    errs = []
    if code.count('render(); render();'):
        errs.append('có chỗ gọi render() hai lần liền nhau')
    for need in ['function taxCalc(', "case 'printTax'", 'DEFAULT_POLICY', 'id="toast"', 'id="print"']:
        if need not in html:
            errs.append('thiếu: ' + need)
    if 'IndexedDB' not in html and 'indexedDB' not in html:
        errs.append('thiếu phần lưu bằng IndexedDB')
    if "localStorage" not in html:
        errs.append('thiếu phần lưu dự phòng bằng localStorage')
    return errs


def main():
    global path_used
    path_used = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    html = read_html(path_used)
    code = script_body(html)
    errs = check_syntax(code) + check_invariants(html, code)
    print('%s: %d byte, script %d dòng' % (path_used, len(html.encode('utf-8')), code.count('\n') + 1))
    if errs:
        for e in errs:
            print('LỖI: ' + e)
        return 1
    print('Không thấy lỗi.')
    return 0


path_used = DEFAULT
if __name__ == '__main__':
    sys.exit(main())
