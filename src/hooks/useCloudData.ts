import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppData, Category, Transaction, MonthArchive, SavingsGoal, DEFAULT_INSIGHT_PREFS, InsightPreferences } from '@/lib/types';
import { prefillFixedTransactions } from '@/lib/store';
import { toast } from 'sonner';

const STORAGE_KEY = 'mytracker-data';

const defaultData: AppData = {
  categories: [],
  transactions: [],
  savingsGoal: { monthlyTarget: null },
  hasSeenWelcome: false,
  profile: { name: '' },
  archives: [],
  viewingMonth: null,
  lastAutoLogged: null,
  insightPreferences: DEFAULT_INSIGHT_PREFS,
  deletedAutoLogs: {},
};

export type SyncStatus = 'synced' | 'syncing' | 'error';

export function useCloudData(userId: string | undefined) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedJson = useRef('');
  const dataRef = useRef<AppData>(defaultData);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Load from cloud (with offline fallback)
  const loadFromCloud = useCallback(async () => {
    if (!userId) return;
    try {
      // Check if we're online
      if (!navigator.onLine) {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as AppData;
          const filled = prefillFixedTransactions({ ...defaultData, ...parsed, viewingMonth: null });
          setData(filled);
          lastSavedJson.current = JSON.stringify(filled);
          hasLoadedRef.current = true;
          setSyncStatus('error');
          toast.info("Meow! You're offline. Kash loaded your cached data. 🐱📦");
          setLoading(false);
          return;
        }
      }
      const [profileRes, catsRes, txnsRes, goalRes, archivesRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('savings_goals').select('*').eq('user_id', userId).single(),
        supabase.from('archives').select('*').eq('user_id', userId).order('month_key'),
        supabase.from('app_settings').select('*').eq('user_id', userId).single(),
      ]);

      if (catsRes.error) throw catsRes.error;
      if (txnsRes.error) throw txnsRes.error;
      if (archivesRes.error) throw archivesRes.error;

      const categories: Category[] = uniqueByLocalId(catsRes.data || []).map((c: any) => ({
        id: c.local_id || c.id,
        name: c.name,
        planned: Number(c.planned),
        isFixed: c.is_fixed,
        isSavings: c.is_savings,
      }));

      const transactions: Transaction[] = (txnsRes.data || []).map((t: any) => ({
        id: t.local_id || t.id,
        date: t.date,
        categoryId: t.category_local_id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as 'income' | 'expense',
      }));

      const archives: MonthArchive[] = (archivesRes.data || []).map((a: any) => ({
        monthKey: a.month_key,
        label: a.label,
        categories: a.categories_snapshot as Category[],
        transactions: a.transactions_snapshot as Transaction[],
        savingsGoal: a.savings_goal_snapshot as SavingsGoal,
        totalIncome: Number(a.total_income),
        totalExpense: Number(a.total_expense),
        totalSaved: Number(a.total_saved),
      }));

      const cloudData: AppData = {
        categories,
        transactions,
        savingsGoal: { monthlyTarget: goalRes.data?.monthly_target != null ? Number(goalRes.data.monthly_target) : null },
        hasSeenWelcome: settingsRes.data?.has_seen_welcome ?? false,
        profile: { name: profileRes.data?.name || '' },
        archives,
        viewingMonth: null,
        lastAutoLogged: settingsRes.data?.last_auto_logged as any || null,
        insightPreferences: {
          ...DEFAULT_INSIGHT_PREFS,
          ...((settingsRes.data as any)?.insight_preferences as Partial<InsightPreferences> | undefined),
        },
        deletedAutoLogs: ((settingsRes.data as any)?.deleted_auto_logs as Record<string, string[]> | undefined) || {},
      };

      // If cloud is empty, check localStorage for migration
      const hasCloudData = categories.length > 0 || transactions.length > 0 || archives.length > 0;
      if (!hasCloudData) {
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          try {
            const localData = JSON.parse(localRaw) as Partial<AppData>;
            if ((localData.categories?.length || 0) > 0 || (localData.transactions?.length || 0) > 0) {
              const migrated: AppData = {
                ...defaultData,
                ...localData,
                profile: { name: localData.profile?.name || '' },
                archives: localData.archives || [],
                viewingMonth: null,
                lastAutoLogged: localData.lastAutoLogged || null,
              };
              await saveToCloud(userId, migrated);
              const filled = prefillFixedTransactions(migrated);
              setData(filled);
              lastSavedJson.current = JSON.stringify(filled);
              localStorage.removeItem(STORAGE_KEY);
              toast.success("Meow! Kash moved your data to the cloud vault! ☁️🐱");
              setLoading(false);
              return;
            }
          } catch {}
        }
      }

      const filled = prefillFixedTransactions(cloudData);
      setData(filled);
      lastSavedJson.current = JSON.stringify(filled);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filled));
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Cloud load error:', err);
      setSyncStatus('error');
      toast.error("Hiss! Kash couldn't load your data. Refresh before making changes so nothing gets overwritten.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFromCloud();
  }, [loadFromCloud]);

  // Re-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Purr! Back online. Syncing your data... 🐱☁️");
      loadFromCloud();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadFromCloud]);

  // Auto-save to cloud with debounce
  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      // Also save to localStorage as fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      // Guard: never push to cloud until we've successfully loaded once.
      // Prevents the empty default state from wiping the user's real data.
      if (!hasLoadedRef.current) {
        return next;
      }

      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSyncStatus('syncing');

      saveTimer.current = setTimeout(async () => {
        if (!userId) return;
        const json = JSON.stringify(next);
        if (json === lastSavedJson.current) {
          setSyncStatus('synced');
          return;
        }
        try {
          await saveToCloud(userId, next);
          lastSavedJson.current = json;
          setSyncStatus('synced');
        } catch (err) {
          console.error('Cloud save error:', err);
          setSyncStatus('error');
          toast.error("Hiss! Couldn't sync to the cloud. Data saved locally.");
        }
      }, 800);

      return next;
    });
  }, [userId]);

  const forceSave = useCallback(async () => {
    if (!userId) {
      toast.error("Hiss! You're not signed in. Can't save to cloud.");
      return;
    }
    if (!hasLoadedRef.current) {
      toast.error("Hiss! Kash hasn't loaded your data yet. Refresh first so we don't overwrite it.");
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus('syncing');
    try {
      const current = dataRef.current;
      await saveToCloud(userId, current);
      lastSavedJson.current = JSON.stringify(current);
      setSyncStatus('synced');
      toast.success("Purr! Kash saved everything to the cloud. ☁️🐱");
    } catch (err) {
      console.error('Manual save error:', err);
      setSyncStatus('error');
      toast.error("Hiss! Couldn't save to the cloud. Try again.");
    }
  }, [userId]);

  return { data, updateData, loading, syncStatus, forceSave };
}

function formatPostgrestInList(values: string[]) {
  return `(${values.map(value => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')})`;
}

function uniqueByLocalId<T extends { local_id: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter(row => {
    if (seen.has(row.local_id)) return false;
    seen.add(row.local_id);
    return true;
  });
}

async function assertSafeCategorySync(userId: string, data: AppData) {
  const categoryIds = new Set(data.categories.map(category => category.id));
  const transactionWithMissingCategory = data.transactions.find(transaction => !categoryIds.has(transaction.categoryId));

  if (transactionWithMissingCategory) {
    throw new Error('Refusing to save transactions that point to missing categories.');
  }

  if (data.categories.length > 0) return;

  const { count, error } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  if ((count || 0) > 0 || data.transactions.length > 0) {
    throw new Error('Refusing to overwrite saved categories with an empty category list.');
  }
}

async function saveToCloud(userId: string, data: AppData) {
  await assertSafeCategorySync(userId, data);

  // Upsert profile
  await supabase.from('profiles').upsert({
    user_id: userId,
    name: data.profile.name,
  }, { onConflict: 'user_id' }).throwOnError();

  // Sync categories without deleting first. This prevents a failed insert from
  // wiping the category list and avoids relying on DB unique constraints.
  const { data: existingCategoryRows, error: existingCategoryError } = await supabase
    .from('categories')
    .select('id, local_id')
    .eq('user_id', userId);

  if (existingCategoryError) throw existingCategoryError;

  const existingCategories = uniqueByLocalId(existingCategoryRows || []);
  const existingCategoryIdsByLocalId = new Map(existingCategories.map(row => [row.local_id, row.id]));

  if (data.categories.length > 0) {
    await Promise.all(data.categories.map(async c => {
      const payload = {
        user_id: userId,
        local_id: c.id,
        name: c.name,
        planned: c.planned,
        is_fixed: c.isFixed,
        is_savings: c.isSavings || false,
      };
      const existingId = existingCategoryIdsByLocalId.get(c.id);
      if (existingId) {
        await supabase.from('categories').update(payload).eq('id', existingId).throwOnError();
      } else {
        await supabase.from('categories').insert(payload).throwOnError();
      }
    }));

    await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId)
      .not('local_id', 'in', formatPostgrestInList(data.categories.map(c => c.id)))
      .throwOnError();
  }

  // Sync transactions without deleting first.
  const { data: existingTransactionRows, error: existingTransactionError } = await supabase
    .from('transactions')
    .select('id, local_id')
    .eq('user_id', userId);

  if (existingTransactionError) throw existingTransactionError;

  const existingTransactions = uniqueByLocalId(existingTransactionRows || []);
  const existingTransactionIdsByLocalId = new Map(existingTransactions.map(row => [row.local_id, row.id]));

  if (data.transactions.length > 0) {
    await Promise.all(data.transactions.map(async t => {
      const payload = {
        user_id: userId,
        local_id: t.id,
        date: t.date,
        category_local_id: t.categoryId,
        description: t.description,
        amount: t.amount,
        type: t.type,
      };
      const existingId = existingTransactionIdsByLocalId.get(t.id);
      if (existingId) {
        await supabase.from('transactions').update(payload).eq('id', existingId).throwOnError();
      } else {
        await supabase.from('transactions').insert(payload).throwOnError();
      }
    }));

    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .not('local_id', 'in', formatPostgrestInList(data.transactions.map(t => t.id)))
      .throwOnError();
  } else {
    await supabase.from('transactions').delete().eq('user_id', userId).throwOnError();
  }

  // Upsert savings goal
  await supabase.from('savings_goals').upsert({
    user_id: userId,
    monthly_target: data.savingsGoal.monthlyTarget,
  }, { onConflict: 'user_id' }).throwOnError();

  // Sync archives: upsert first, then delete removed rows.
  if (data.archives.length > 0) {
    await supabase.from('archives').upsert(
      data.archives.map(a => ({
        user_id: userId,
        month_key: a.monthKey,
        label: a.label,
        categories_snapshot: a.categories as any,
        transactions_snapshot: a.transactions as any,
        savings_goal_snapshot: a.savingsGoal as any,
        total_income: a.totalIncome,
        total_expense: a.totalExpense,
        total_saved: a.totalSaved,
      })),
      { onConflict: 'user_id,month_key' },
    ).throwOnError();

    await supabase
      .from('archives')
      .delete()
      .eq('user_id', userId)
      .not('month_key', 'in', formatPostgrestInList(data.archives.map(a => a.monthKey)))
      .throwOnError();
  } else {
    await supabase.from('archives').delete().eq('user_id', userId).throwOnError();
  }

  // Upsert app settings
  await supabase.from('app_settings').upsert({
    user_id: userId,
    has_seen_welcome: data.hasSeenWelcome,
    last_auto_logged: data.lastAutoLogged as any,
    insight_preferences: data.insightPreferences as any,
    deleted_auto_logs: (data.deletedAutoLogs || {}) as any,
  } as any, { onConflict: 'user_id' }).throwOnError();
}
