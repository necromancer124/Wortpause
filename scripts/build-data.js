import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseVocabulary } from './importer.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const source = resolve(root, '..', 'anki_german_a1_vocab');
const raw = readFileSync(join(source, 'Goethe Institute A1 Wordlist.txt'), 'utf8');
const cards = parseVocabulary(raw);

mkdirSync(join(root, 'data'), { recursive: true });
writeFileSync(join(root, 'data', 'cards.json'), `${JSON.stringify(cards)}\n`);
cpSync(join(source, 'audio'), join(root, 'audio'), { recursive: true });

console.log(`Imported ${cards.length} cards and audio from ${source}`);
