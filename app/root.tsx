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
import { getUserFromSession } from '~/services/auth';
import { getThemeFromSession } from './services/theme';
import { getConferenceData, getFavouritesData } from '~/services/requests';
import { cn } from '~/lib/utils';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { Toaster } from '~/components/ui/toaster';
import { PageHeader } from './components/PageHeader';
import { Button } from '~/components/ui/button';
import { toast } from '~/components/ui/use-toast';

export const links: LinksFunction = () => [
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
  { rel: 'stylesheet', href: styles },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export async function loader({ request, context }) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const session = await context.sessionStorage.getSession(cookie);
    const userAgent = request.headers.get('User-Agent') || '';

    const user = await getUserFromSession(session, userAgent, context);
    const userDetails = await user?.getUser();
    const theme = await getThemeFromSession(session);
    const themeDetails = theme?.getTheme();

    const fosdem = await getConferenceData('2025');
    const favourites = await getFavouritesData(userDetails.id, context);

    const data = {
      user: userDetails || null,
      theme: themeDetails || null,
      fosdem,
      favourites,
    };

    return json(data, {
      headers: {
        'Set-Cookie': await context.sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);

    return json(
      {
        success: false,
        message: 'An error occurred',
        data: error,
      },
      { status: 500 }
    );
  }
}

function Providers({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return <ThemeProvider specifiedTheme={data?.theme}>{children}</ThemeProvider>;
}

function Document({
  children,
  hasProvider,
  theme,
  loaderData,
}: {
  children: React.ReactNode;
  hasProvider: boolean;
  theme?: string;
  loaderData?: unknown;
}) {
  return (
    <html lang="en" className={theme ? clsx(theme) : undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ThemeProviderNoFlash
          ssrTheme={loaderData?.theme ? Boolean(loaderData?.theme) : false}
        />
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
            <div className="bg-muted text-muted-foreground text-center py-2">
              <p>
                You are logged in with the guest account:{' '}
                <strong>{loaderData.user.name}</strong>{' '}
                <Button
                  variant="link"
                  onClick={() =>
                    toast({
                      title: 'Not implemented',
                      description:
                        "We're still working on signing in with full accounts.",
                    })
                  }
                >
                  Sign In
                </Button>
              </p>
            </div>
          )}
          <div className="container flex-1">
            {children}
            <Toaster />
          </div>
          <Footer hasProvider={hasProvider} />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

function Layout({
  children,
  hasProvider,
}: {
  children: React.ReactNode;
  hasProvider: boolean;
}) {
  const loaderData = useLoaderData<typeof loader>();

  const [theme] = useTheme();

  return (
    <Document hasProvider={hasProvider} theme={theme} loaderData={loaderData}>
      {children}
    </Document>
  );
}

export default function App() {
  useSWEffect();

  return (
    <Providers>
      <Layout hasProvider={true}>
        <Outlet />
      </Layout>
    </Providers>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Document hasProvider={false}>
        <PageHeader heading={`${error.status} ${error.statusText}`} />
        <div className="prose">
          <p>{error.data}</p>
        </div>
      </Document>
    );
  } else if (error instanceof Error) {
    return (
      <Document hasProvider={false}>
        <PageHeader heading="Error" />
        <div className="prose">
          <p>{error.message}</p>
          <p>The stack trace is:</p>
          <pre>{error.stack}</pre>
        </div>
      </Document>
    );
  } else {
    return (
      <Document hasProvider={false}>
        <PageHeader heading="Unknown Error" />
      </Document>
    );
  }
}
