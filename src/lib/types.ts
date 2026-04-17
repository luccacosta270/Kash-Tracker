export interface Category {
  id: string;
  name: string;
  planned: number;
  isFixed: boolean;
  isSavings?: boolean;
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

export interface AutoLoggedSummary {
  monthKey: string;
  count: number;
  names: string[];
}

export type InsightCategory = 'smart' | 'stocks' | 'savings' | 'coach' | 'summary' | 'funny';
export type InsightRefresh = 'daily' | 'open' | 'weekly';
export type InsightLength = 'short' | 'detailed';

export interface InsightPreferences {
  enabled: boolean;
  categories: InsightCategory[];
  refresh: InsightRefresh;
  length: InsightLength;
  humor: boolean;
}

export const DEFAULT_INSIGHT_PREFS: InsightPreferences = {
  enabled: true,
  categories: ['smart'],
  refresh: 'daily',
  length: 'short',
  humor: true,
};

export interface AppData {
  categories: Category[];
  transactions: Transaction[];
  savingsGoal: SavingsGoal;
  hasSeenWelcome: boolean;
  profile: UserProfile;
  archives: MonthArchive[];
  /** The month currently being viewed, null = current live month */
  viewingMonth: string | null;
  lastAutoLogged: AutoLoggedSummary | null;
  insightPreferences: InsightPreferences;
}

export type KashState = 'welcome' | 'happy' | 'cool' | 'alert' | 'newmonth' | 'darkmode';
