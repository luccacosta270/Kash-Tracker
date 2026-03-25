import { AppData, Category, Transaction, MonthArchive } from './types';

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
  profile: { name: '', avatarUrl: null },
  archives: [],
  viewingMonth: null,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...defaultData,
      ...parsed,
      profile: { ...defaultData.profile, ...(parsed.profile || {}) },
      archives: parsed.archives || [],
      viewingMonth: null, // always start on current month
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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const monthKey = getCurrentMonthKey();
  return transactions.filter(t => t.date.startsWith(monthKey));
}

export function getTransactionsForMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter(t => t.date.startsWith(monthKey));
}

export function getSpendingByCategory(transactions: Transaction[], categories: Category[], monthKey?: string) {
  const key = monthKey || getCurrentMonthKey();
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
  const monthKey = getCurrentMonthKey();
  const fixed = data.categories.filter(c => c.isFixed && c.planned > 0);
  const existing = data.transactions.filter(t => t.date.startsWith(monthKey));

  let updated = false;
  const newTransactions = [...data.transactions];

  for (const cat of fixed) {
    const alreadyExists = existing.some(t => t.categoryId === cat.id && t.description.startsWith('[Fixed]'));
    if (!alreadyExists) {
      newTransactions.push({
        id: generateId(),
        date: `${monthKey}-01`,
        categoryId: cat.id,
        description: `[Fixed] ${cat.name}`,
        amount: cat.planned,
        type: 'expense',
      });
      updated = true;
    }
  }

  if (updated) return { ...data, transactions: newTransactions };
  return data;
}

export function archiveMonth(data: AppData): { archived: AppData; monthLabel: string } {
  const monthKey = getCurrentMonthKey();
  const monthTransactions = getCurrentMonthTransactions(data.transactions);
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const now = new Date();
  const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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

  // Remove current month transactions, keep others
  const remainingTransactions = data.transactions.filter(t => !t.date.startsWith(monthKey));

  return {
    archived: {
      ...data,
      transactions: remainingTransactions,
      archives: [...data.archives.filter(a => a.monthKey !== monthKey), archive],
    },
    monthLabel: label,
  };
}

/** Get savings from categories marked as isSavings for a given month */
export function getSavingsContributions(transactions: Transaction[], categories: Category[], monthKey?: string): number {
  const key = monthKey || getCurrentMonthKey();
  const monthly = transactions.filter(t => t.date.startsWith(key));
  const savingsCats = categories.filter(c => c.isSavings);
  return savingsCats.reduce((sum, cat) => {
    return sum + monthly
      .filter(t => t.categoryId === cat.id && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, 0);
}
