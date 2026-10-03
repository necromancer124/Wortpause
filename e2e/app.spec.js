import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

test('mobile learning flow works and reloads offline', async ({ page, context }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Wortpause/);
  await expect(page.locator('#card-area')).toBeVisible();
  await expect(page.locator('#session-count')).toHaveText('0 / 10');

  await page.getByRole('button', { name: /Show answer/ }).click();
  await expect(page.locator('#answer')).toBeVisible();
  await page.getByRole('button', { name: /Good/ }).click();
  await expect(page.locator('#session-count')).toHaveText('1 / 10');

  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.locator('#goal-select').selectOption('5');
  await page.getByLabel('English → German').check();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.locator('#side-label')).toHaveText('English');
  await expect(page.locator('#session-count')).toHaveText('0 / 5');

  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#card-area')).toBeVisible();
  await expect(page.locator('#side-label')).toHaveText('English');

  await page.getByRole('button', { name: /Show answer/ }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/mobile-card.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('guide explains the app and the complete word list can be searched and scrolled', async ({ page }) => {
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.locator('#card-area').waitFor({ state: 'visible' });

  await page.getByRole('button', { name: 'How the app works' }).click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await expect(page.locator('#help-dialog')).toContainText('Show the answer');
  await expect(page.locator('#help-dialog')).toContainText('Again');
  await page.screenshot({ path: 'test-results/mobile-help.png', fullPage: true });
  await page.locator('#help-dialog').getByRole('button', { name: 'Start learning' }).click();

  await page.getByRole('button', { name: 'Browse all words' }).click();
  await expect(page.locator('#words-dialog')).toBeVisible();
  await expect(page.locator('#word-count')).toHaveText('813 words');
  const scrollable = await page.locator('#word-list').evaluate(element => element.scrollHeight > element.clientHeight);
  expect(scrollable).toBe(true);
  await page.locator('#word-list').evaluate(element => { element.scrollTop = 500; });
  await expect.poll(() => page.locator('#word-list').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/mobile-word-list.png', fullPage: true });

  await page.getByRole('searchbox', { name: 'Search German or English' }).fill('Apfel');
  await expect(page.locator('#word-count')).toHaveText('1 word');
  await expect(page.locator('.word-row')).toContainText('der Apfel');
  await page.locator('.word-row').click();
  await expect(page.locator('.word-row-detail')).toBeVisible();
});
