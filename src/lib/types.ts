export interface Category {
  id: string;
  name: string;
  planned: number;
  isFixed: boolean;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  categoryId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface SavingsGoal {
  monthlyTarget: number | null;
}

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
  savingsGoal: SavingsGoal;
  hasSeenWelcome: boolean;
}

export type PennyState = 'welcome' | 'highfive' | 'steady' | 'sweat' | 'rescue';
