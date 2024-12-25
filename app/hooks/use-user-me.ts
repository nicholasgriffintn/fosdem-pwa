import { useQuery } from '@tanstack/react-query';

export function useProfile() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const response = await fetch('/api/user/me');
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