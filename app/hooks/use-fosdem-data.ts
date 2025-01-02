'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllData } from "~/functions/getFosdemData";

export function useFosdemData({
  year,
}: {
  year: number;
}) {
  const { data: fosdemData, isLoading } = useQuery({
    queryKey: ['fosdem', 'full'],
    queryFn: async () => {
      const data = await getAllData({
        data: {
          year,
        },
      });

      return data;
    },
  });

  return {
    fosdemData,
    loading: isLoading,
  };
}