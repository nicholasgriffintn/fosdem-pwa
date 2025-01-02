import { createContext, useContext, useState } from 'react';

import { constants } from '~/constants';

type YearContextType = {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
};

export const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useState(constants.DEFAULT_YEAR);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
}