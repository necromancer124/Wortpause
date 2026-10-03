import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleCard, selectSession } from '../src/scheduler.js';

const now = Date.UTC(2026, 9, 3, 12);

test('Again resets a card and brings it back in one minute', () => {
  const next = scheduleCard({ interval: 12, ease: 2.5, repetitions: 5 }, 'again', now);
  assert.equal(next.interval, 0);
  assert.equal(next.repetitions, 0);
  assert.equal(next.due, now + 60_000);
});

test('Good graduates a new card to one day', () => {
  const next = scheduleCard({}, 'good', now);
  assert.equal(next.interval, 1);
  assert.equal(next.repetitions, 1);
  assert.equal(next.due, now + 86_400_000);
});

test('Hard grows a learned interval slowly', () => {
  const next = scheduleCard({ interval: 10, ease: 2.5, repetitions: 3 }, 'hard', now);
  assert.equal(next.interval, 12);
  assert.equal(next.ease, 2.35);
});

test('Easy gives a new card a four-day interval', () => {
  const next = scheduleCard({}, 'easy', now);
  assert.equal(next.interval, 4);
  assert.equal(next.ease, 2.65);
});

test('Session includes due cards before unseen cards and respects the limit', () => {
  const cards = [{ id: 'new-1' }, { id: 'due-1' }, { id: 'future-1' }, { id: 'new-2' }];
  const progress = {
    'due-1': { due: now - 1 },
    'future-1': { due: now + 10_000 }
  };
  const session = selectSession(cards, progress, 3, now, () => 0.5);
  assert.equal(session[0].id, 'due-1');
  assert.equal(session.length, 3);
  assert.equal(session.some(card => card.id === 'future-1'), false);
});
