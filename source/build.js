// Construit Chamboule Coach : d'abord les tests, puis la version Claude (un seul fichier) et l'appli du téléphone.
// Usage, depuis la racine du dépôt : node source/build.js
// Si un test échoue ou si la page est cassée, rien n'est construit.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const SRC = __dirname;
const ROOT = path.resolve(SRC, '..');
const BUILD = path.join(ROOT, 'build');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const fail = msg => { console.error(`\n✖ ${msg}\nRien n’a été construit.`); process.exit(1); };

/* 1. Tests */
console.log('1/3 Tests automatiques…');
const t = spawnSync(process.execPath, ['--test', path.join(ROOT, 'tests', 'logic.test.js')], { encoding: 'utf8' });
const counts = (t.stdout || '').split('\n').filter(l => /^ℹ (tests|pass|fail) /.test(l)).map(l => l.slice(2)).join(' · ');
if (t.status !== 0) { console.error(t.stdout, t.stderr); fail('Des tests échouent.'); }
console.log('    ' + counts);

/* 2. Assemblage de la page en un seul fichier */
console.log('2/3 Assemblage de la page…');
const script = ['logic.js', 'drawings.js', 'app.js'].map(read).join('\n');
const scriptBlock = `(() => {\n'use strict';\n\n${script}})();\n`;
try { new vm.Script(scriptBlock, { filename: 'chamboule-coach.js' }); } catch (e) { fail('Erreur de syntaxe dans le code : ' + e.message); }
if (/<\/script/i.test(scriptBlock)) fail('Le code contient « </script> », ce qui casserait la page.');
const html = `${read('page-head.html').trimEnd()}\n<style>\n${read('styles.css').trimEnd()}\n</style>\n\n${read('page-body.html').trimEnd()}\n\n<script>\n${scriptBlock}</script>\n`;
if (/mot-retire/i.test(html)) fail('Un diagnostic apparaît dans le code de la page.');
const kb = Buffer.byteLength(html) / 1024;
if (kb > 1024) fail(`Page trop lourde : ${Math.round(kb)} Ko.`);
fs.mkdirSync(BUILD, { recursive: true });
fs.writeFileSync(path.join(BUILD, 'chamboule-coach.html'), html);
console.log(`    build/chamboule-coach.html : version Claude (${Math.round(kb)} Ko)`);

/* 3. Appli du téléphone (racine du dépôt, publiée par GitHub Pages) */
console.log('3/3 Appli du téléphone…');
require('./build-phone-app.js');
