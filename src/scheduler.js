const DAY = 86_400_000;

export function scheduleCard(previous = {}, rating, now = Date.now()) {
  const currentInterval = previous.interval || 0;
  const repetitions = previous.repetitions || 0;
  const currentEase = previous.ease || 2.5;

  if (rating === 'again') {
    return { interval: 0, repetitions: 0, ease: Math.max(1.3, currentEase - 0.2), due: now + 60_000 };
  }

  if (rating === 'hard') {
    const interval = currentInterval ? Math.max(1, Math.round(currentInterval * 1.2)) : 1;
    return { interval, repetitions: repetitions + 1, ease: Math.max(1.3, currentEase - 0.15), due: now + interval * DAY };
  }

  if (rating === 'easy') {
    const ease = currentEase + 0.15;
    const interval = currentInterval ? Math.max(4, Math.round(currentInterval * ease * 1.3)) : 4;
    return { interval, repetitions: repetitions + 1, ease, due: now + interval * DAY };
  }

  const interval = currentInterval ? Math.max(1, Math.round(currentInterval * currentEase)) : 1;
  return { interval, repetitions: repetitions + 1, ease: currentEase, due: now + interval * DAY };
}

function shuffled(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function selectSession(cards, progress, limit, now = Date.now(), random = Math.random) {
  const due = cards.filter(card => progress[card.id]?.due <= now);
  const unseen = shuffled(cards.filter(card => !progress[card.id]), random);
  return [...due, ...unseen].slice(0, limit);
}
