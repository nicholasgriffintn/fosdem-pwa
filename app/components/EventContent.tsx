import type { Event } from "~/types/fosdem";

export function EventContent({ event }: { event: Event }) {
  return (
    <>
      {event.abstract && (
        <div className="prose prose-lg prose-indigo overflow-scroll mt-4">
          <h2 className="text-xl font-medium">Abstract</h2>
          <div
            className="mt-2"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: We're using the abstract as HTML
            dangerouslySetInnerHTML={{ __html: event.abstract }}
          />
        </div>
      )}
      {event.description && (
        <div className="prose prose-lg prose-indigo overflow-scroll mt-4">
          <h2 className="text-xl font-medium">Description</h2>
          <div
            className="mt-2"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: We're using the description as HTML
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </div>
      )}
      {event.links?.length > 0 && (
        <div className="mt-2">
          <h2 className="text-xl font-medium">Links</h2>
          <ul className="mt-2 space-y-2 list-disc list-inside">
            {event.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
