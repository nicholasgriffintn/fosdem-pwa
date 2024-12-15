import { createFileRoute } from '@tanstack/react-router'

import { getHomepageData } from '~/functions/getFosdemData'
import { PageHeader } from '~/components/PageHeader'

export const Route = createFileRoute('/bookmarks')({
  component: BookmarksHome,
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
