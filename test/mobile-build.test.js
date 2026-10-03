import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildMobile } from '../scripts/build-mobile.js';

test('mobile build contains the complete offline app without development files', () => {
  const output = mkdtempSync(join(tmpdir(), 'wortpause-mobile-'));
  try {
    buildMobile(output);
    assert.equal(existsSync(join(output, 'index.html')), true);
    assert.equal(existsSync(join(output, 'src', 'app.js')), true);
    assert.equal(existsSync(join(output, 'node_modules')), false);
    assert.equal(JSON.parse(readFileSync(join(output, 'data', 'cards.json'))).length, 813);
    assert.equal(readdirSync(join(output, 'audio')).filter(name => name.endsWith('.mp3')).length, 813);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
