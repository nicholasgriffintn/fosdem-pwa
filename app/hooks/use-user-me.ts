import { useQuery } from '@tanstack/react-query';

export function useProfile() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const response = await fetch('/api/user/me');

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();

            if (!data.user) {
                throw new Error('Unauthorized');
            }

            return data.user;
        },
    });

    return {
        user,
        loading: isLoading,
    };
}