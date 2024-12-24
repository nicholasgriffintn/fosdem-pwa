import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useAuth } from '~/hooks/use-auth';
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/PageHeader";

export const Route = createFileRoute("/signin")({
  component: SignInPage,
  head: () => ({
    meta: [
      {
        title: 'Sign In | FOSDEM PWA',
        description: 'Sign in to FOSDEM PWA',
      },
    ],
  }),
});

function SignInPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Sign in" />
        <form method="GET" className="flex flex-col gap-2">
          <Button formAction="/api/auth/github" type="submit" variant="outline" size="lg">
            Sign in with GitHub
          </Button>
        </form>
      </div>
    </div>
  );
}