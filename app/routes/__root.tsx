import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  ScriptOnce,
  ScrollRestoration,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense } from "react";

import { getAuthSession } from "~/server/auth";
import appCss from "~/styles/app.css?url";
import { cn } from "~/lib/utils";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Toaster } from "~/components/ui/toaster";
import { Button } from "~/components/ui/button";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : lazy(() =>
      // Lazy load in development
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    );

const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const { user } = await getAuthSession();
  return user;
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {
    const user = await getUser();
    return { user };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "FOSDEM PWA",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  const { user } = Route.useRouteContext();

  return (
    <html className="dark">
      <head>
        <Meta />
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
          {!user ? (
            <div className="bg-muted text-muted-foreground text-center py-2">
              <p>
                You are not logged in.
                <Button
                  variant="link" asChild size="sm">
                  <Link to="/signin">Sign in to remember your preferences</Link>
                </Button>
              </p>
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground text-center py-2">
              <p>
                You are logged in as {user.name}.
                <form method="POST" action="/api/auth/logout">
                  <Button type="submit" className="w-fit" variant="destructive" size="lg">
                    Sign out
                  </Button>
                </form>
              </p>
            </div>
          )}
          <div className="container flex-1">
            {children}
            <Toaster />
          </div>
          <Footer />
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <Suspense>
            <TanStackRouterDevtools position="bottom-right" />
          </Suspense>
        </main>
        <ScrollRestoration />

        <ScriptOnce>
          {`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
        </ScriptOnce>

        <Scripts />
      </body>
    </html>
  );
}