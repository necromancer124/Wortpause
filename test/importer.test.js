import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVocabulary } from '../scripts/importer.js';

test('parses the tab-separated deck fields and audio filename', () => {
  const input = '42\tder Apfel, -Ä\tEin Pfund Äpfel bitte.\tapple\tOne pound of apples, please.\tformal\tfruit note\t[sound:tts-42.mp3]';
  assert.deepEqual(parseVocabulary(input), [{
    id: '42',
    german: 'der Apfel, -Ä',
    germanExample: 'Ein Pfund Äpfel bitte.',
    english: 'apple',
    englishExample: 'One pound of apples, please.',
    register: 'formal',
    note: 'fruit note',
    audio: 'tts-42.mp3'
  }]);
});

test('ignores blank and malformed rows', () => {
  const input = '\nmissing\tcolumns\n43\thallo\tHallo!\thello\tHello!\t\t\t[sound:tts-43.mp3]\n';
  assert.equal(parseVocabulary(input).length, 1);
});
