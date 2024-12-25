import { useQuery } from '@tanstack/react-query';

export function useUserId({
    userId,
}: {
    userId: string;
}) {
    const { data: user, isLoading } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const response = await fetch(`/api/user/${userId}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.user;
        },
    });

    return {
        user,
        loading: isLoading,
    };
}