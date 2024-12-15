import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '~/components/PageHeader'

export const Route = createFileRoute('/bookmarks')({
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
        <PageHeader heading="Bookmarks (WIP)" />
      </div>
    </div>
  )
}
