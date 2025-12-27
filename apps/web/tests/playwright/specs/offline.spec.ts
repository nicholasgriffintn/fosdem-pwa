import { test, expect, type Page } from '@playwright/test';

const pagesToTest = [
  { path: '/?year=2026', name: 'Home', expectedTitle: /FOSDEM/i },
  { path: '/type/keynote?year=2026', name: 'Type - Keynote', expectedTitle: /Keynote/i },
  { path: '/track/featured?year=2026', name: 'Track - Featured', expectedTitle: /Featured/i },
  { path: '/event/8376?year=2026&test=false', name: 'Event Detail', expectedTitle: /FOSDEM/i },
  { path: '/live?year=2026&test=true', name: 'Live', expectedTitle: /Live/i },
  { path: '/speakers?year=2026', name: 'Speakers', expectedTitle: /Speakers/i },
  { path: '/rooms?year=2026&day=null', name: 'Rooms', expectedTitle: /Rooms/i },
  { path: '/bookmarks?year=2026', name: 'Bookmarks', expectedTitle: /Bookmarks/i },
  { path: '/map?year=2026', name: 'Map', expectedTitle: /Map/i },
  { path: '/privacy', name: 'Privacy', expectedTitle: /Privacy/i },
  { path: '/terms', name: 'Terms', expectedTitle: /Terms/i },
];

const isLocalhost = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').includes('localhost');

async function waitForServiceWorkerReady(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.ready;

    if (registration.active?.state === 'activated' && navigator.serviceWorker.controller) {
      console.log("Service worker already activated");
      return;
    }

    console.log("Waiting for service worker activation...");

    await new Promise<void>((resolve) => {
      const check = async () => {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration && registration.active?.state === 'activated') {
          console.log("Service worker activated");
          resolve();
        } else {
          console.log("Service worker not yet activated, waiting...");
          setTimeout(check, 100);
        }
      };
      check();
    });
  });
}

test.describe('Offline Capabilities', () => {
  test.skip(isLocalhost, 'Offline tests require a production build with service worker');

  test('pages are accessible offline after initial visit', async ({ page, context }) => {
    await page.goto('/?year=2026');
    await page.waitForLoadState('networkidle');
    await waitForServiceWorkerReady(page);

    await context.setOffline(true);

    for (const { path, name } of pagesToTest) {
      await test.step(`${name} page loads offline`, async () => {
        await page.goto(path);
        await expect(page.locator('main')).toBeVisible();
      });
    }
  });

  test('typical navigation works offline', async ({ page, context }) => {
    await page.goto('/?year=2026');
    await page.waitForLoadState('networkidle');
    await waitForServiceWorkerReady(page);

    await page.goto('/type/keynote?year=2026');
    await page.waitForLoadState('networkidle');

    await page.goto('/event/8376?year=2026&test=false');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    await page.goto('/type/keynote?year=2026');
    await expect(page).toHaveTitle(/Keynote/i);

    await page.goto('/event/8376?year=2026&test=false');
    await expect(page.locator('main')).toBeVisible();
  });
});
