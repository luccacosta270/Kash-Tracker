import { useMemo, useState } from 'react';
import { AppData, PennyState } from '@/lib/types';
import { getCurrentMonthTransactions, getSpendingByCategory, getSavingsContributions } from '@/lib/store';
import PennyMascot from '@/components/PennyMascot';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

export default function Dashboard({ data, updateData }: DashboardProps) {
  const monthly = useMemo(() => getCurrentMonthTransactions(data.transactions), [data.transactions]);

  const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Savings progress is ONLY from transactions in savings-flagged categories
  const savingsFromCategories = useMemo(() => getSavingsContributions(data.transactions, data.categories), [data.transactions, data.categories]);

  const savingsProgress = savingsFromCategories;

  const spending = useMemo(() => getSpendingByCategory(data.transactions, data.categories), [data.transactions, data.categories]);

  // Check if fixed transactions were just prefilled this session
  const hasFixedPrefilled = useMemo(() => {
    return data.categories.some(c => c.isFixed && c.planned > 0) &&
      monthly.some(t => t.description.startsWith('[Fixed]'));
  }, [data.categories, monthly]);

  const { pennyState, overCat } = useMemo(() => {
    if (!data.hasSeenWelcome) return { pennyState: 'welcome' as PennyState, overCat: undefined };

    const worst = spending.reduce<{ pct: number; name: string }>((w, s) => {
      if (s.category.planned > 0 && s.percentage > w.pct) return { pct: s.percentage, name: s.category.name };
      return w;
    }, { pct: 0, name: '' });

    if (worst.pct > 100) return { pennyState: 'rescue' as PennyState, overCat: worst.name };
    if (worst.pct > 95) return { pennyState: 'sweat' as PennyState, overCat: worst.name };
    if (worst.pct > 70) return { pennyState: 'steady' as PennyState, overCat: undefined };
    return { pennyState: 'highfive' as PennyState, overCat: undefined };
  }, [data.hasSeenWelcome, spending]);

  const dismissWelcome = () => {
    updateData(d => ({ ...d, hasSeenWelcome: true }));
  };

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(data.savingsGoal.monthlyTarget?.toString() || '');

  const saveGoal = () => {
    const val = parseFloat(goalInput);
    updateData(d => ({
      ...d,
      savingsGoal: { monthlyTarget: isNaN(val) || val <= 0 ? null : val },
    }));
    setEditingGoal(false);
  };

  const userName = data.profile.name || undefined;

  return (
    <div className="space-y-4 px-4 pt-4 pb-24">
      <div onClick={!data.hasSeenWelcome ? dismissWelcome : undefined} className={!data.hasSeenWelcome ? 'cursor-pointer' : ''}>
        <PennyMascot state={pennyState} overBudgetCategory={overCat} userName={userName} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Net Balance" value={netBalance} colorClass={netBalance >= 0 ? 'text-savings' : 'text-alert'} />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Monthly Spend" value={-totalExpense} colorClass="text-alert" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Income" value={totalIncome} colorClass="text-income" />
        </div>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-savings" />
            <h3 className="font-semibold text-sm text-card-foreground">
              {data.savingsGoal.monthlyTarget ? 'Savings Goal' : 'Savings This Month'}
            </h3>
          </div>
          <button onClick={() => setEditingGoal(!editingGoal)} className="text-xs text-primary font-medium touch-target">
            {editingGoal ? 'Cancel' : 'Edit Goal'}
          </button>
        </div>

        {editingGoal ? (
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              placeholder="Monthly target..."
              className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={saveGoal} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground touch-target">
              Save
            </button>
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-card-foreground">
              ${savingsProgress.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            {!data.savingsGoal.monthlyTarget && savingsFromCategories === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Mark categories as "Savings" to track progress here
              </p>
            )}
            {data.savingsGoal.monthlyTarget && (
              <div className="mt-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-savings transition-all"
                    style={{ width: `${Math.min(100, (savingsProgress / data.savingsGoal.monthlyTarget) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((savingsProgress / data.savingsGoal.monthlyTarget) * 100)}% of ${data.savingsGoal.monthlyTarget.toLocaleString()} goal
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: number; colorClass: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className={`text-2xl font-bold ${colorClass}`}>
        {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
