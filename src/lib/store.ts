import { AppData, Category, Transaction, MonthArchive, DEFAULT_INSIGHT_PREFS } from './types';

const STORAGE_KEY = 'mytracker-data';

const defaultCategories: Category[] = [
  { id: 'rent', name: 'Rent', planned: 0, isFixed: true },
  { id: 'groceries', name: 'Groceries', planned: 0, isFixed: false },
  { id: 'transport', name: 'Transport', planned: 0, isFixed: false },
  { id: 'entertainment', name: 'Entertainment', planned: 0, isFixed: false },
  { id: 'utilities', name: 'Utilities', planned: 0, isFixed: true },
];

const defaultData: AppData = {
  categories: defaultCategories,
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

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonthKey(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return formatMonthKey(date);
}

function buildAutoLoggedTransactions(
  categories: Category[],
  sourceTransactions: Transaction[],
  existingTransactions: Transaction[],
  targetMonthKey: string,
  deletedSignatures: string[] = [],
): Transaction[] {
  const targetDate = `${targetMonthKey}-01`;
  const autoLoggedTransactions: Transaction[] = [];
  const autoLoggableCategoryIds = new Set(
    categories
      .filter(category => (category.isFixed || category.isSavings) && category.planned > 0)
      .map(category => category.id),
  );
  const deletedSet = new Set(deletedSignatures);
  const sig = (categoryId: string, description: string) =>
    `${categoryId}|${description.trim().toLowerCase()}`;

  const sortedSourceTransactions = [...sourceTransactions].sort((a, b) => a.date.localeCompare(b.date));

  sortedSourceTransactions.forEach(transaction => {
    if (transaction.type !== 'expense') return;
    if (!autoLoggableCategoryIds.has(transaction.categoryId)) return;

    const description = transaction.description.trim() || categories.find(category => category.id === transaction.categoryId)?.name || 'Recurring transaction';
    if (deletedSet.has(sig(transaction.categoryId, description))) return;

    const alreadyExists = existingTransactions.some(existingTransaction =>
      existingTransaction.date.startsWith(targetMonthKey)
      && existingTransaction.categoryId === transaction.categoryId
      && existingTransaction.description.trim() === transaction.description.trim()
      && existingTransaction.type === 'expense',
    );

    if (alreadyExists) return;

    autoLoggedTransactions.push({
      id: generateId(),
      date: targetDate,
      categoryId: transaction.categoryId,
      description,
      amount: transaction.amount,
      type: 'expense',
    });
  });

  if (autoLoggedTransactions.length > 0) return autoLoggedTransactions;

  categories.forEach(category => {
    const shouldAutoLog = (category.isFixed || category.isSavings) && category.planned > 0;
    const alreadyExists = existingTransactions.some(
      transaction => transaction.date.startsWith(targetMonthKey) && transaction.categoryId === category.id && transaction.type === 'expense',
    );

    if (!shouldAutoLog || alreadyExists) return;
    if (deletedSet.has(sig(category.id, category.name))) return;

    autoLoggedTransactions.push({
      id: generateId(),
      date: targetDate,
      categoryId: category.id,
      description: category.name,
      amount: category.planned,
      type: 'expense',
    });
  });

  return autoLoggedTransactions;
}

function getArchiveLabel(monthKey: string): string {
  return new Date(`${monthKey}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getLatestActiveMonthKey(transactions: Transaction[]): string | null {
  const monthKeys = Array.from(new Set(transactions.map(transaction => transaction.date.slice(0, 7)))).sort();
  return monthKeys.at(-1) || null;
}

export function getLiveMonthKey(transactions: Transaction[]): string {
  const currentMonthKey = getCurrentMonthKey();
  const latestActiveMonthKey = getLatestActiveMonthKey(transactions);
  if (!latestActiveMonthKey) return currentMonthKey;
  return latestActiveMonthKey > currentMonthKey ? latestActiveMonthKey : currentMonthKey;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Strip avatarUrl from old profile data
    const profile = { name: parsed.profile?.name || '' };
    return {
      ...defaultData,
      ...parsed,
      profile,
      archives: parsed.archives || [],
      viewingMonth: null,
      lastAutoLogged: parsed.lastAutoLogged || null,
      deletedAutoLogs: parsed.deletedAutoLogs || {},
    };
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return formatMonthKey(now);
}

export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const monthKey = getLiveMonthKey(transactions);
  return transactions.filter(t => t.date.startsWith(monthKey));
}

export function getTransactionsForMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter(t => t.date.startsWith(monthKey));
}

export function getSpendingByCategory(transactions: Transaction[], categories: Category[], monthKey?: string) {
  const key = monthKey || getLiveMonthKey(transactions);
  const monthly = transactions.filter(t => t.date.startsWith(key));
  return categories.map(cat => {
    const actual = monthly
      .filter(t => t.categoryId === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const diff = cat.planned - actual;
    const pct = cat.planned > 0 ? (actual / cat.planned) * 100 : 0;
    return { category: cat, actual, difference: diff, percentage: pct };
  });
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function prefillFixedTransactions(data: AppData): AppData {
  const monthKey = getLiveMonthKey(data.transactions);
  const previousMonthKey = shiftMonthKey(monthKey, -1);
  // First, collapse any duplicate fixed/savings auto-logs in the current month.
  // Dedup key: same date + categoryId + normalized description + amount + type.
  const fixedOrSavingsIds = new Set(
    data.categories.filter(c => c.isFixed || c.isSavings).map(c => c.id),
  );
  const seenSigs = new Set<string>();
  const dedupedTxns: Transaction[] = [];
  for (const t of data.transactions) {
    if (t.type === 'expense' && fixedOrSavingsIds.has(t.categoryId)) {
      const sig = `${t.date}|${t.categoryId}|${t.description.trim().toLowerCase()}|${t.amount}`;
      if (seenSigs.has(sig)) continue;
      seenSigs.add(sig);
    }
    dedupedTxns.push(t);
  }
  const workingData = dedupedTxns.length !== data.transactions.length
    ? { ...data, transactions: dedupedTxns }
    : data;

  const previousMonthTransactions = workingData.transactions.filter(transaction => transaction.date.startsWith(previousMonthKey));
  const archivedPreviousMonthTransactions = data.archives.find(archive => archive.monthKey === previousMonthKey)?.transactions || [];
  const sourceTransactions = previousMonthTransactions.length > 0 ? previousMonthTransactions : archivedPreviousMonthTransactions;
  const deletedForMonth = data.deletedAutoLogs?.[monthKey] || [];
  const autoLoggedTransactions = buildAutoLoggedTransactions(workingData.categories, sourceTransactions, workingData.transactions, monthKey, deletedForMonth);

  if (autoLoggedTransactions.length > 0) {
    return {
      ...workingData,
      transactions: [...workingData.transactions, ...autoLoggedTransactions],
      lastAutoLogged: {
        monthKey,
        count: autoLoggedTransactions.length,
        names: autoLoggedTransactions.map(transaction => transaction.description),
      },
    };
  }

  return workingData;
}

export function archiveMonth(data: AppData): { archived: AppData; monthLabel: string } {
  const monthKey = getLatestActiveMonthKey(data.transactions) || getCurrentMonthKey();
  const monthTransactions = getTransactionsForMonth(data.transactions, monthKey);
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const label = getArchiveLabel(monthKey);
  const nextMonthKey = shiftMonthKey(monthKey, 1);

  const archive: MonthArchive = {
    monthKey,
    label,
    categories: [...data.categories],
    transactions: monthTransactions,
    savingsGoal: { ...data.savingsGoal },
    totalIncome,
    totalExpense,
    totalSaved: Math.max(0, totalIncome - totalExpense),
  };

  const remainingTransactions = data.transactions.filter(t => !t.date.startsWith(monthKey));
  const deletedForNextMonth = data.deletedAutoLogs?.[nextMonthKey] || [];
  const autoLoggedTransactions = buildAutoLoggedTransactions(data.categories, monthTransactions, remainingTransactions, nextMonthKey, deletedForNextMonth);

  return {
    archived: {
      ...data,
      transactions: [...remainingTransactions, ...autoLoggedTransactions],
      archives: [...data.archives.filter(a => a.monthKey !== monthKey), archive],
      lastAutoLogged: autoLoggedTransactions.length > 0
        ? {
            monthKey: nextMonthKey,
            count: autoLoggedTransactions.length,
            names: autoLoggedTransactions.map(transaction => transaction.description),
          }
        : null,
    },
    monthLabel: label,
  };
}

export function getSavingsContributions(transactions: Transaction[], categories: Category[], monthKey?: string): number {
  const key = monthKey || getLiveMonthKey(transactions);
  const monthly = transactions.filter(t => t.date.startsWith(key));
  const savingsCats = categories.filter(c => c.isSavings);
  return savingsCats.reduce((sum, cat) => {
    return sum + monthly
      .filter(t => t.categoryId === cat.id && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, 0);
}
