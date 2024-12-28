'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

export function useAuth() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: user, isLoading } = useQuery({
        queryKey: ['auth'],
        queryFn: async () => {
            const response = await fetch('/api/auth/session');
            if (!response.ok) return null;
            const data = await response.json();
            return data.user;
        },
    });

    const logout = useMutation({
        mutationFn: async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
        },
        onSuccess: () => {
            queryClient.setQueryData(['auth'], null);
            navigate({ to: '/' });
        },
    });

    return {
        user,
        loading: isLoading,
        logout: logout.mutate,
    };
}