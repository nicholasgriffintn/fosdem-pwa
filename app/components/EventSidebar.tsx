import clsx from 'clsx';

import type { Event } from '~/types/fosdem';

export function EventSidebar({ event, isMobile = false }: { event: Event; isMobile?: boolean }) {
  const sidebarClassName = clsx('h-full', {
    'p-6': !isMobile,
    'pt-6 pb-6': isMobile,
  });

  const abstractClassName = clsx(
    'w-full prose prose-lg prose-indigo overflow-scroll',
    {
      'max-h-[465px]': !isMobile,
    }
  );

  return (
    <div className={sidebarClassName}>
      {event.abstract && (
        <div className={abstractClassName}>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
          <div dangerouslySetInnerHTML={{ __html: event.abstract }} />
        </div>
      )}
    </div>
  );
}