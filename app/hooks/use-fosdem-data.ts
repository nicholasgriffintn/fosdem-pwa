'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllData } from "~/functions/getFosdemData";
import { constants } from '~/constants';

export function useFosdemData() {
  const { data: fosdemData, isLoading } = useQuery({
    queryKey: ['fosdem', 'full'],
    queryFn: async () => {
      const data = await getAllData({
        data: {
          year: constants.YEAR,
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