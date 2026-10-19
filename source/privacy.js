// Mots qui ne doivent jamais apparaître dans la page ni dans le résumé pour le kiné (diagnostic).
// Ils sont rangés sous forme d’empreintes SHA-256 pour ne pas être écrits en clair dans ce dépôt public.
const crypto = require('crypto');
const FORBIDDEN = new Set([
  '62c7ce634a5e551f8ffcae5bff95231d783afa9e539de1e5f107850bda7fcc45',
  'a55f7a285f9b05365e4931f74b74893c2123a08f6df19feaaf048e8e1a24b339'
]);
const hash = w => crypto.createHash('sha256').update(w).digest('hex');
module.exports = function forbiddenWords(text) {
  const plain = String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return [...new Set(plain.match(/[a-z]{4,}/g) || [])].filter(w => FORBIDDEN.has(hash(w)));
};
