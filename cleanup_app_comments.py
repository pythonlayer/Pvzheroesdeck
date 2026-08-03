from pathlib import Path
import re
path = Path('app.js')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
out = []
skip = False

separator_re = re.compile(r'^\s*(//\s*[-=]{3,}.*|/\*\s*[-=]{3,}.*|\*\s*[-=]{3,}.*|\*/\s*$)')

for line in lines:
    stripped = line.lstrip()
    if skip:
        if '*/' in stripped:
            skip = False
        continue
    if separator_re.match(stripped):
        if stripped.startswith('/*') and '*/' not in stripped:
            skip = True
        continue
    out.append(line)

new_text = '\n'.join(out) + ('\n' if text.endswith('\n') else '')
if new_text != text:
    path.write_text(new_text, encoding='utf-8')
    print('cleaned')
else:
    print('nothing changed')
