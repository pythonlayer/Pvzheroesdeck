const fs = require('fs');
const path = 'app.js';
const text = fs.readFileSync(path, 'utf8');
for (let i = 0; i < text.length; i++) {
  const code = text.charCodeAt(i);
  if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
    console.log('found', code, 'at', i, JSON.stringify(text.slice(Math.max(0, i - 40), i + 40)));
    process.exit(0);
  }
}
console.log('none');
