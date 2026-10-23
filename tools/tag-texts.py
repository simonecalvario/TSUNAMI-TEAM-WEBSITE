#!/usr/bin/env python3
"""Give every static text of index.html (paragraphs, headings, list items) a stable data-tx key,
so the owner can fix typos from the site (assets/js/texts.js). Existing keys are kept; new texts
get the next free number of their section. Run it after adding new static text."""
import re, sys
p = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
s = open(p, encoding='utf-8').read()
main_a, main_b = s.index('<main>'), s.index('</main>')
body = s[main_a:main_b]
used = set(re.findall(r'data-tx="([^"]+)"', body))
out, pos, sec, count = [], 0, None, {}
tag_re = re.compile(r'<(section)\b[^>]*\bid="([^"]+)"|<(p|h3|h4|li)\b([^>]*)>(.*?)</\3>', re.S)
for m in tag_re.finditer(body):
    if m.group(1):
        sec = m.group(2); continue
    attrs, inner = m.group(4), m.group(5)
    if 'data-tx=' in attrs or ' id=' in attrs or 'callsign' in attrs or 'cd-msg' in attrs or 'id="' in inner or '<button' in inner or '<input' in inner or not re.sub(r'<[^>]+>|\s', '', inner):
        continue
    n = count.get(sec, 0)
    while True:
        n += 1
        key = '%s-%d' % (sec, n)
        if key not in used: break
    count[sec] = n; used.add(key)
    out.append(body[pos:m.start(4)] + ' data-tx="' + key + '"')
    pos = m.start(4)
out.append(body[pos:])
s = s[:main_a] + ''.join(out) + s[main_b:]
open(p, 'w', encoding='utf-8').write(s)
print(len(used), 'texts tagged')
