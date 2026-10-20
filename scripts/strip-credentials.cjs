// 이미지·SVG 속 C2PA 서명(콘텐츠 자격증명)만 지웁니다. 픽셀, EXIF 등 나머지는 그대로 둡니다.
// 사용: npm run strip-credentials (assets 전체) 또는 node scripts/strip-credentials.cjs 파일...
const fs = require('node:fs');
const path = require('node:path');

const type = (b, i) => b.toString('latin1', i, i + 4);

function stripPng(b) {
  const parts = [b.subarray(0, 8)];
  let i = 8, found = false;
  while (i + 8 <= b.length) {
    const end = i + 12 + b.readUInt32BE(i);
    if (type(b, i + 4) === 'caBX') found = true; else parts.push(b.subarray(i, end));
    i = end;
  }
  return found ? Buffer.concat(parts) : b;
}

function stripWebp(b) {
  const parts = [];
  let i = 12, found = false;
  while (i + 8 <= b.length) {
    const n = b.readUInt32LE(i + 4), end = i + 8 + n + (n & 1);
    if (type(b, i) === 'C2PA') found = true; else parts.push(b.subarray(i, end));
    i = end;
  }
  if (!found) return b;
  const body = Buffer.concat(parts), head = Buffer.from('RIFF\0\0\0\0WEBP', 'latin1');
  head.writeUInt32LE(body.length + 4, 4);
  return Buffer.concat([head, body]);
}

function stripJpeg(b) {
  const parts = [b.subarray(0, 2)];
  let i = 2, found = false;
  while (i + 4 <= b.length && b[i] === 0xff && b[i + 1] !== 0xda) {
    const end = i + 2 + b.readUInt16BE(i + 2), seg = b.subarray(i, end);
    if (b[i + 1] === 0xeb && seg.includes('jumb')) found = true; else parts.push(seg);
    i = end;
  }
  return found ? Buffer.concat([...parts, b.subarray(i)]) : b;
}

function stripSvg(b) {
  const s = b.toString('latin1');
  const t = s.replace(/<c2pa:manifest[^>]*>[\s\S]*?<\/c2pa:manifest>/g, '')
    .replace(/<metadata>\s*<\/metadata>/g, '')
    .replace(/\s+xmlns:c2pa="[^"]*"/g, '');
  return t === s ? b : Buffer.from(t, 'latin1');
}

const strippers = { '.png': stripPng, '.webp': stripWebp, '.jpg': stripJpeg, '.jpeg': stripJpeg, '.svg': stripSvg };
const strip = (b, file) => (strippers[path.extname(file).toLowerCase()] || (x => x))(b);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const signedFiles = dir => walk(dir).filter(f => { const b = fs.readFileSync(f); return !strip(b, f).equals(b); });

module.exports = { strip, signedFiles };

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const files = process.argv.length > 2 ? process.argv.slice(2) : walk(path.join(root, 'assets'));
  let count = 0;
  for (const f of files) {
    const b = fs.readFileSync(f), out = strip(b, f);
    if (out.equals(b)) continue;
    fs.writeFileSync(f, out);
    count++;
    console.log(`서명 제거: ${path.relative(root, f)} (${b.length - out.length} B)`);
  }
  console.log(count ? `${count}개 파일에서 C2PA 서명을 지웠습니다.` : 'C2PA 서명이 남은 파일이 없습니다.');
}
