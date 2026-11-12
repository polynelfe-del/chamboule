// Bundle the same coaching screens with Android-only reminders and no remote assets.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const output = path.resolve(process.argv[2]);
const stock = read('index.html');
const webPush = read('source/push-client.js');
assert(stock.includes(webPush), 'Rebuild index.html before packaging Android');
const html = stock.replace(webPush, () => read('source/native-reminders.js'))
  .replace(/<link rel="manifest"[^>]*>\s*/, '')
  .replace(/<script>\s*if \('serviceWorker' in navigator\) addEventListener\('load',[\s\S]*?<\/script>\s*/, '');
assert(!/supabase\.co|navigator\.serviceWorker\.register\(/.test(html), 'Remote notification code in Android bundle');
assert(html.includes('ChambouleAndroid'), 'Android bridge absent');
fs.mkdirSync(path.join(output, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(output, 'index.html'), html);
for (const name of ['icon-192.png', 'apple-touch-icon.png', 'fonts/fredoka.woff2', 'fonts/pacifico.woff2', 'fonts/nunito.woff2', 'fonts/nunito-italic.woff2', 'fonts/LICENCES.txt']) {
  fs.copyFileSync(path.join(root, name), path.join(output, name));
}
console.log('Android web assets prepared');
