import React, { createContext, useContext, useState } from 'react';

const DateFilterContext = createContext(null);

export const DateFilterProvider = ({ children }) => {
  const [preset, setPreset] = useState('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  const value = {
    preset,
    setPreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    globalSearch,
    setGlobalSearch,
    getFilterParams: () => ({
      preset,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
  };

  return (
    <DateFilterContext.Provider value={value}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => useContext(DateFilterContext);

