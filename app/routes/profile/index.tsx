import { createFileRoute, Navigate } from '@tanstack/react-router'

import { useProfile } from '~/hooks/use-user-me'
import { PageHeader } from '~/components/PageHeader'
import { ConferenceBadge } from '~/components/ConferenceBadge'
import { Spinner } from "~/components/Spinner";

export const Route = createFileRoute('/profile/')({
    component: ProfilePage,
    head: () => ({
        meta: [
            {
                title: 'Profile | FOSDEM PWA',
                description: 'Profile page',
            },
        ],
    }),
})

function ProfilePage() {
    const { user, loading } = useProfile()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/" />
    }

    return (
        <div className="min-h-screen">
            <div className="relative py-6 lg:py-10">
                <PageHeader heading="Profile" displayHeading={false} />
                <ConferenceBadge user={user} conferenceYear="2025" />
            </div>
        </div>
    )
}
