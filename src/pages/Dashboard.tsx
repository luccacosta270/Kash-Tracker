import { useMemo, useState } from 'react';
import { AppData, KashState } from '@/lib/types';
import { getLiveMonthKey, getCurrentMonthTransactions, getSpendingByCategory } from '@/lib/store';
import KashMascot from '@/components/KashMascot';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

export default function Dashboard({ data, updateData }: DashboardProps) {
  const liveMonthKey = getLiveMonthKey(data.transactions);
  const monthly = useMemo(() => getCurrentMonthTransactions(data.transactions), [data.transactions]);

  const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const savingsProgress = useMemo(() => {
    const savingsCategoryIds = new Set(data.categories.filter(category => category.isSavings).map(category => category.id));
    return monthly.reduce((sum, transaction) => {
      if (transaction.type !== 'expense' || !savingsCategoryIds.has(transaction.categoryId)) return sum;
      return sum + transaction.amount;
    }, 0);
  }, [monthly, data.categories]);

  const spending = useMemo(() => getSpendingByCategory(data.transactions, data.categories), [data.transactions, data.categories]);
  const autoLoggedThisMonth = data.lastAutoLogged?.monthKey === liveMonthKey ? data.lastAutoLogged : null;

  // SMART EMOTION: Only alert on GENERAL categories (not Fixed/Savings)
  const { kashState, overCat } = useMemo(() => {
    if (autoLoggedThisMonth?.count) return { kashState: 'newmonth' as KashState, overCat: undefined };
    if (!data.hasSeenWelcome) return { kashState: 'welcome' as KashState, overCat: undefined };

    // Only check general (non-fixed, non-savings) categories for alert state
    const generalSpending = spending.filter(s => !s.category.isFixed && !s.category.isSavings);
    const worst = generalSpending.reduce<{ pct: number; name: string }>((w, s) => {
      if (s.category.planned > 0 && s.percentage > w.pct) return { pct: s.percentage, name: s.category.name };
      return w;
    }, { pct: 0, name: '' });

    // Also check if total remaining is negative
    const totalRemaining = netBalance;

    if (worst.pct > 100 || totalRemaining < 0) return { kashState: 'alert' as KashState, overCat: worst.name || 'General spending' };
    if (worst.pct > 95) return { kashState: 'alert' as KashState, overCat: worst.name };
    if (worst.pct > 70) return { kashState: 'cool' as KashState, overCat: undefined };
    return { kashState: 'happy' as KashState, overCat: undefined };
  }, [autoLoggedThisMonth, data.hasSeenWelcome, spending, netBalance]);

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

  // Group transactions into 3 sections
  const savingsCatIds = new Set(data.categories.filter(c => c.isSavings).map(c => c.id));
  const fixedCatIds = new Set(data.categories.filter(c => c.isFixed && !c.isSavings).map(c => c.id));

  const savingsTransactions = monthly.filter(t => t.type === 'expense' && savingsCatIds.has(t.categoryId));
  const fixedTransactions = monthly.filter(t => t.type === 'expense' && fixedCatIds.has(t.categoryId));
  const generalTransactions = monthly.filter(t => t.type === 'expense' && !savingsCatIds.has(t.categoryId) && !fixedCatIds.has(t.categoryId));
  const incomeTransactions = monthly.filter(t => t.type === 'income');

  const getCatName = (id: string) => data.categories.find(c => c.id === id)?.name || 'Unknown';

  const subTotal = (txns: typeof monthly) => txns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4 px-4 pt-4 pb-24">
      <div onClick={!data.hasSeenWelcome ? dismissWelcome : undefined} className={!data.hasSeenWelcome ? 'cursor-pointer' : ''}>
        <KashMascot
          state={kashState}
          overBudgetCategory={overCat}
          userName={userName}
          autoLoggedCount={autoLoggedThisMonth?.count}
          autoLoggedNames={autoLoggedThisMonth?.names}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netBalance={netBalance}
          preferences={data.insightPreferences}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Net Balance This Month" value={netBalance} colorClass={netBalance >= 0 ? 'text-savings' : 'text-alert'} />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Monthly Expenses" value={-totalExpense} colorClass="text-alert" />
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
            {!data.savingsGoal.monthlyTarget && savingsProgress === 0 && (
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

      {/* 3-Section Transaction Groups */}
      {incomeTransactions.length > 0 && (
        <TransactionGroup
          title="💰 Income"
          transactions={incomeTransactions}
          getCatName={getCatName}
          total={subTotal(incomeTransactions)}
          totalLabel="Total Income"
          colorClass="text-income"
        />
      )}

      <TransactionGroup
        title="🏦 Savings"
        transactions={savingsTransactions}
        getCatName={getCatName}
        total={subTotal(savingsTransactions)}
        totalLabel="Total Savings"
        colorClass="text-savings"
      />

      <TransactionGroup
        title="📌 Fixed Bills"
        transactions={fixedTransactions}
        getCatName={getCatName}
        total={subTotal(fixedTransactions)}
        totalLabel="Total Fixed"
        colorClass="text-muted-foreground"
      />

      <TransactionGroup
        title="🛒 General Spending"
        transactions={generalTransactions}
        getCatName={getCatName}
        total={subTotal(generalTransactions)}
        totalLabel="Total General"
        colorClass="text-alert"
      />
    </div>
  );
}

function TransactionGroup({
  title, transactions, getCatName, total, totalLabel, colorClass,
}: {
  title: string;
  transactions: { id: string; description: string; amount: number; type: string; categoryId: string }[];
  getCatName: (id: string) => string;
  total: number;
  totalLabel: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card space-y-2">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {transactions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">No transactions logged yet.</p>
      ) : (
        <>
          {transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-sm font-medium text-card-foreground">{t.description}</p>
                <p className="text-xs text-muted-foreground">{getCatName(t.categoryId)}</p>
              </div>
              <span className={`text-sm font-bold ${t.type === 'income' ? 'text-income' : colorClass}`}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{totalLabel}</span>
            <span className={`text-xs font-bold ${colorClass}`}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </>
      )}
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
