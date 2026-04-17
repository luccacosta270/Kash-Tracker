import { useState, useMemo } from 'react';
import { AppData, InsightPreferences } from '@/lib/types';
import { archiveMonth, getCurrentMonthTransactions } from '@/lib/store';
import { Archive, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import HomeInsightPreferences from '@/components/HomeInsightPreferences';

interface ProfileProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
  onViewMonth: (monthKey: string) => void;
}

export default function ProfilePage({ data, updateData, onViewMonth }: ProfileProps) {
  const [nameInput, setNameInput] = useState(data.profile.name);
  const [showManageMonth, setShowManageMonth] = useState(false);

  const saveName = () => {
    updateData(d => ({ ...d, profile: { ...d.profile, name: nameInput.trim() } }));
    toast.success('Name saved!');
  };

  const handleCloseMonth = () => {
    if (!confirm('Archive this month and reset spending? Planned budgets and fixed items will carry over.')) return;
    updateData(d => {
      const { archived } = archiveMonth(d);
      return archived;
    });
    toast.success('Month archived! Spending reset.');
  };

  const monthly = useMemo(() => getCurrentMonthTransactions(data.transactions), [data.transactions]);
  const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const updateInsightPrefs = (next: InsightPreferences) => {
    updateData(d => ({ ...d, insightPreferences: next }));
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Profile</h2>

      {/* Name Only */}
      <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground">Your Name</h3>
        <input
          placeholder="Your name"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button onClick={saveName} className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground touch-target">
          Save Name
        </button>
      </div>

      {/* Home Insight Preferences */}
      <HomeInsightPreferences
        preferences={data.insightPreferences}
        userName={data.profile.name}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={totalIncome - totalExpense}
        onChange={updateInsightPrefs}
      />

      {/* Manage Month - Collapsed */}
      <div className="rounded-3xl bg-card p-4 shadow-card">
        <button
          onClick={() => setShowManageMonth(!showManageMonth)}
          className="flex items-center justify-between w-full text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Archive className="h-4 w-4" /> Manage Month
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showManageMonth ? 'rotate-180' : ''}`} />
        </button>
        {showManageMonth && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Close the current month to archive data and start fresh. Budgets carry over.
            </p>
            <button
              onClick={handleCloseMonth}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Close & Archive This Month
            </button>
          </div>
        )}
      </div>

      {/* Past Months */}
      {data.archives.length > 0 && (
        <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
          <h3 className="text-sm font-semibold text-card-foreground">Past Months</h3>
          <div className="space-y-2">
            {[...data.archives].reverse().map(a => (
              <button
                key={a.monthKey}
                onClick={() => onViewMonth(a.monthKey)}
                className="flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm text-card-foreground touch-target"
              >
                <span>{a.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
