import { createHash, randomBytes } from 'node:crypto';

// Share the pairing code with the owner only. Run only the separate SQL line.
// PostgreSQL receives a digest and never needs to display or store the code itself.
const code = randomBytes(16).toString('hex');
const hash = createHash('sha256').update(code).digest('hex');
process.stdout.write(`Code à saisir sur le Xiaomi : ${code.match(/.{4}/g).join('-')}\n`);
process.stdout.write(`update chamboule_push.settings set pairing_hash = '${hash}', pairing_expires_at = now() + interval '7 days' where id;\n`);
