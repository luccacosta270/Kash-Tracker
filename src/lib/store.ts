import { AppData, Category, Transaction } from './types';

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
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    return JSON.parse(raw) as AppData;
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

export function getSpendingByCategory(transactions: Transaction[], categories: Category[]) {
  const monthly = getCurrentMonthTransactions(transactions);
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
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
