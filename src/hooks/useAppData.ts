import { useState, useEffect, useCallback } from 'react';
import { AppData } from '@/lib/types';
import { loadData, saveData, prefillFixedTransactions } from '@/lib/store';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadData();
    return prefillFixedTransactions(loaded);
  });

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  return { data, updateData };
}
