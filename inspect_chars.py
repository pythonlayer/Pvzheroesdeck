from pathlib import Path
text = Path('app.js').read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), 1):
    for j, ch in enumerate(line):
        if ord(ch) < 32 and ch not in '\n\r\t':
            print('line', i, 'col', j, 'char', repr(ch), 'ord', ord(ch))
            raise SystemExit
print('no control chars')
