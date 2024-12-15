import { Link, createFileRoute } from "@tanstack/react-router";

import { Types } from "~/components/Types";
import { getFosdemData } from "~/lib/data";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const fosdem = getFosdemData('2025');
    return { fosdem };
  },
  staleTime: 10_000,
});

function Home() {
  const { fosdem } = Route.useLoaderData();

  if (!fosdem) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          {fosdem.conference.title._text}
        </h1>
        <p className="text-xl text-muted-foreground">
          {fosdem.conference.city._text} / {fosdem.conference.start._text} - {fosdem.conference.end._text}
        </p>
        <div>
          {fosdem.types && (
            <Types types={fosdem.types} />
          )}
        </div>
      </div>
    </div>
  );
}