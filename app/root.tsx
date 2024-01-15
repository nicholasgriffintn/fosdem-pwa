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

import styles from '~/styles/globals.css';
import { getSession, commitSession } from '~/sessions.server';
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

    const session = await getSession(request.headers.get('Cookie'));
    const userId = session.get('userId');

    const data = { user: { id: userId }, fosdem };

    return json(data, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);
  }
}

function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();

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
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Layout>
        <PageHeader heading={`${error.status} ${error.statusText}`} />
        <div className="prose">
          <p>{error.data}</p>
        </div>
      </Layout>
    );
  } else if (error instanceof Error) {
    return (
      <Layout>
        <PageHeader heading="Error" />
        <div className="prose">
          <p>{error.message}</p>
          <p>The stack trace is:</p>
          <pre>{error.stack}</pre>
        </div>
      </Layout>
    );
  } else {
    return (
      <Layout>
        <PageHeader heading="Unknown Error" />
      </Layout>
    );
  }
}
