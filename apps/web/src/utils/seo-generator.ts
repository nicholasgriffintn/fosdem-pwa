import { sanitiseString } from "./sanitise";

export function generateCommonSEOTags({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const sanitisedTitle = sanitiseString(title);
  const sanitisedDescription = sanitiseString(description);

  return [
    {
      title: sanitisedTitle,
    },
    {
      name: "description",
      content: sanitisedDescription,
    },
    {
      property: "og:title",
      content: sanitisedTitle,
    },
    {
      property: "og:description",
      content: sanitisedDescription,
    },
    {
      name: "twitter:title",
      content: sanitisedTitle,
    },
    {
      name: "twitter:description",
      content: sanitisedDescription,
    },
  ]
}