import { createFileRoute } from "@tanstack/react-router";

import { Types } from "~/components/Types";
import { getHomepageData } from "~/functions/getFosdemData";
import { PageHeader } from "../components/PageHeader";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const fosdem = await getHomepageData({ data: { year: '2025' } });
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
        <PageHeader heading={fosdem.conference.title._text} text={`${fosdem.conference.city._text} / ${fosdem.conference.start._text} - ${fosdem.conference.end._text}`} />
        <div>
          {fosdem.types && (
            <Types types={fosdem.types} />
          )}
        </div>
      </div>
    </div>
  );
}