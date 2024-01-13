import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/node';
import { defer } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { useSWEffect, LiveReload } from '@remix-pwa/sw';

import styles from '~/styles/globals.css';
import { getData } from '~/lib/fosdem';
import { cn } from '~/lib/utils';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { Toaster } from '~/components/ui/toaster';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: styles },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export async function loader() {
  const fosdem = await getData({ year: '2024' });

  return defer({
    fosdem,
  });
}

export default function App() {
  useSWEffect();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          '--font-sans',
          '--font-heading'
        )}
      >
        <main className="flex min-h-screen flex-col">
          <Header />
          <div className="container flex-1">
            <Outlet />
            <Toaster />
          </div>
          <Footer />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
