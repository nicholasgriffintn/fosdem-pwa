import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '~/components/PageHeader'

export const Route = createFileRoute('/bookmarks/')({
  component: BookmarksHome,
  head: () => ({
    meta: [
      {
        title: 'Bookmarks | FOSDEM PWA',
        description: 'Bookmarks from FOSDEM 2025',
      },
    ],
  }),
})

function BookmarksHome() {
  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Bookmarks" />
        <div className="bg-muted text-muted-foreground text-center py-2 mb-4">
          <p>This hasn't been implemented yet, I'm working on it.</p>
        </div>
      </div>
    </div>
  )
}
