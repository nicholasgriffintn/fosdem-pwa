import clsx from 'clsx';

import { Event } from '~/functions/getFosdemData';

export function EventSidebar({ event, isMobile = false }: { event: Event; isMobile?: boolean }) {
  const sidebarClassName = clsx('h-full', {
    'p-6': !isMobile,
    'pt-6 pb-6': isMobile,
  });

  const abstractClassName = clsx(
    'w-full prose prose-lg prose-indigo overflow-scroll',
    {
      'max-h-[420px]': !isMobile,
    }
  );

  return (
    <div className={sidebarClassName}>
      {event.abstract && (
        <div className={abstractClassName}>
          <div dangerouslySetInnerHTML={{ __html: event.abstract }} />
        </div>
      )}
      {event.links?.length > 0 && (
        <div>
          <hr className="my-4" />
          <h2>Links</h2>
          <ul>
            {event.links.map((link) => {
              return (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}