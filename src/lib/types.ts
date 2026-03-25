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

export interface UserProfile {
  name: string;
  avatarUrl: string | null;
}

export interface MonthArchive {
  monthKey: string; // e.g. "2026-03"
  label: string; // e.g. "March 2026"
  categories: Category[];
  transactions: Transaction[];
  savingsGoal: SavingsGoal;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
}

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
  savingsGoal: SavingsGoal;
  hasSeenWelcome: boolean;
  profile: UserProfile;
  archives: MonthArchive[];
}

export type PennyState = 'welcome' | 'highfive' | 'steady' | 'sweat' | 'rescue';
