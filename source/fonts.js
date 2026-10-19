// Polices de l’appli, hébergées avec elle : rien n’est chargé depuis Google.
// Fichiers woff2 (alphabet latin) dans fonts/ à la racine du dépôt ; licence SIL Open Font License dans fonts/LICENCES.txt.
// Version Claude : polices intégrées dans la page. Appli du téléphone : fichiers à côté, gardés hors ligne par sw.js.
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'fonts');
const FACES = [
  { family: 'Fredoka', file: 'fredoka.woff2', weight: '600 700', style: 'normal' },
  { family: 'Pacifico', file: 'pacifico.woff2', weight: '400', style: 'normal' },
  { family: 'Nunito', file: 'nunito.woff2', weight: '400 900', style: 'normal' },
  { family: 'Nunito', file: 'nunito-italic.woff2', weight: '700', style: 'italic' }
];
function css(mode) {
  return FACES.map(f => {
    const src = mode === 'inline' ? 'data:font/woff2;base64,' + fs.readFileSync(path.join(DIR, f.file)).toString('base64') : 'fonts/' + f.file;
    return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${src}) format('woff2')}`;
  }).join('\n');
}
module.exports = { DIR, FACES, css };
