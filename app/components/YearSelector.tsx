'use client';

import { useRouter, useSearch } from '@tanstack/react-router';

import { constants } from '~/constants';
import { toast } from '~/hooks/use-toast';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

export function YearSelector() {
  const router = useRouter();
  const { year } = useSearch({ strict: false, });
  const selectedYear = year || constants.DEFAULT_YEAR;

  const handleYearChange = (year: number) => {
    router.navigate({
      to: '/',
      search: { year },
    });

    toast({
      title: 'Year changed',
      description: `You are now viewing the ${year} edition of FOSDEM.`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="year">Year</Label>
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => handleYearChange(Number(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {constants.AVAILABLE_YEARS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 