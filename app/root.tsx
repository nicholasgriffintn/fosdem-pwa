import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import { useSWEffect, LiveReload } from '@remix-pwa/sw';
import clsx from 'clsx';

import styles from '~/styles/globals.css';
import {
  ThemeProvider,
  useTheme,
  ThemeProviderNoFlash,
} from '~/lib/theme-provider';
import { getUserSession } from '~/sessions.server';
import { getData } from '~/lib/fosdem';
import { cn } from '~/lib/utils';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { Toaster } from '~/components/ui/toaster';
import { PageHeader } from './components/PageHeader';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: styles },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export async function loader({ request }: { request: Request }) {
  try {
    const fosdem = await getData({ year: '2024' });

    const session = await getUserSession(request);

    const data = {
      user: { id: session.getUserId() },
      theme: session.getTheme(),
      fosdem,
    };

    return json(data, {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  } catch (error) {
    console.error(error);
  }
}

function Providers({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return <ThemeProvider specifiedTheme={data?.theme}>{children}</ThemeProvider>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();

  const [theme] = useTheme();

  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Links />
        <ThemeProviderNoFlash ssrTheme={Boolean(loaderData?.theme)} />
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
          {loaderData?.user?.id && (
            <div className="bg-primary text-white text-center py-2">
              <p>
                You are logged in as <strong>{loaderData.user.id}</strong>
              </p>
            </div>
          )}
          <div className="container flex-1">
            {children}
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

export default function App() {
  useSWEffect();

  return (
    <Providers>
      <Layout>
        <Outlet />
      </Layout>
    </Providers>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Providers>
        <Layout>
          <PageHeader heading={`${error.status} ${error.statusText}`} />
          <div className="prose">
            <p>{error.data}</p>
          </div>
        </Layout>
      </Providers>
    );
  } else if (error instanceof Error) {
    return (
      <Providers>
        <Layout>
          <PageHeader heading="Error" />
          <div className="prose">
            <p>{error.message}</p>
            <p>The stack trace is:</p>
            <pre>{error.stack}</pre>
          </div>
        </Layout>
      </Providers>
    );
  } else {
    return (
      <Providers>
        <Layout>
          <PageHeader heading="Unknown Error" />
        </Layout>
      </Providers>
    );
  }
}
