'use client';

import { useRouter } from '@tanstack/react-router';

import { constants } from '~/constants';
import { toast } from '~/hooks/use-toast';
import { useYear } from '~/context/year';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

export function YearSelector() {
  const router = useRouter();
  const { selectedYear, setSelectedYear } = useYear();

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    router.invalidate();

    toast({
      title: 'Year changed',
      description: `You are now viewing the ${year} edition of FOSDEM.`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="year">Year</Label>
      <Select
        value={selectedYear}
        onValueChange={(value) => handleYearChange(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {constants.AVAILABLE_YEARS.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 