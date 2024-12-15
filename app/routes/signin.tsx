import { createFileRoute, redirect } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/PageHeader";

export const Route = createFileRoute("/signin")({
  component: SignInPage,
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({
        to: "/",
      });
    }
  },
});

function SignInPage() {
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