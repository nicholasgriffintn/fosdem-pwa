import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const urlsToTest = [
  '/?year=2026',
  '/type/keynote?year=2026',
  '/type/notfound?year=2026',
  '/track/featured?year=2026',
  '/track/notfound?year=2026',
  '/event/8376?year=2026&test=false',
  '/event/notfound?year=2026&test=false',
  '/live?year=2026&test=true',
  '/speakers?year=2026',
  '/speakers/andreas_itzchak_rehberg?year=2026',
  '/speakers/notfound?year=2026',
  '/rooms?year=2026&day=null',
  '/rooms/aw1120?year=2026',
  '/rooms/notfound?year=2026',
  '/bookmarks?year=2026',
  '/map?year=2026',
  '/signin?year=2026',
  '/privacy',
  '/terms',
  '/bookmarks?year=2026&tab=watch-later',
];

test.describe('Accessibility Tests', () => {
  for (const url of urlsToTest) {
    test(`should not have any automatically detectable accessibility violations on ${url}`, async ({ page }) => {
      await page.goto(url);
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
