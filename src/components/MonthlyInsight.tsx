import { useState, useEffect } from 'react';
import { MonthArchive } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import kashHappy from '@/assets/kash-happy.png';
import kashCool from '@/assets/kash-cool.png';
import kashAlert from '@/assets/kash-alert.png';

interface MonthlyInsightProps {
  archive: MonthArchive;
  userName?: string;
}

export default function MonthlyInsight({ archive, userName }: MonthlyInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const net = archive.totalIncome - archive.totalExpense;
  const spendRatio = archive.totalIncome > 0 ? archive.totalExpense / archive.totalIncome : 1;
  const isGood = spendRatio <= 0.8;
  const isBad = spendRatio > 1;

  // Top spending categories
  const catSpending = archive.transactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      const cat = archive.categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Unknown';
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {});
  const topCats = Object.entries(catSpending).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, v]) => `${n} ($${v.toFixed(0)})`).join(', ');

  useEffect(() => {
    let cancelled = false;
    const fetchInsight = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('kash-greeting', {
          body: {
            type: 'monthly-insight',
            userName: userName || '',
            totalIncome: archive.totalIncome,
            totalExpense: archive.totalExpense,
            netBalance: net,
            savingsProgress: archive.totalSaved,
            savingsGoal: archive.savingsGoal?.monthlyTarget,
            topCategories: topCats,
          },
        });
        if (!cancelled && data?.message) setInsight(data.message);
      } catch {
        // Fallback handled below
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInsight();
    return () => { cancelled = true; };
  }, [archive.monthKey]);

  const kashImg = isBad ? kashAlert : isGood ? kashHappy : kashCool;
  const grade = isBad ? 'Overspent' : isGood ? 'Great Month!' : 'Okay Month';
  const gradeColor = isBad ? 'text-alert' : isGood ? 'text-savings' : 'text-muted-foreground';

  const fallbackMessage = isBad
    ? `Hiss! You spent more than you earned this month. Time to sharpen those claws on that budget!`
    : isGood
    ? `Purr-fect month! You kept spending under control and saved well. Keep stacking!`
    : `Not bad, not great. You spent most of what you earned. Let's aim to save more next month!`;

  return (
    <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <img src={kashImg} alt="Kash" className="w-12 h-12 object-contain" />
        <div>
          <h3 className="text-sm font-bold text-card-foreground">Kash's Monthly Review</h3>
          <span className={`text-xs font-semibold ${gradeColor}`}>{grade}</span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-card-foreground">
        {loading ? (
          <span className="animate-pulse text-muted-foreground">Kash is analyzing your month... 🐱</span>
        ) : (
          insight || fallbackMessage
        )}
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Spend Ratio</p>
          <p className={`text-sm font-bold ${isBad ? 'text-alert' : 'text-savings'}`}>
            {(spendRatio * 100).toFixed(0)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Saved</p>
          <p className="text-sm font-bold text-savings">
            ${archive.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-sm font-bold text-card-foreground">{archive.transactions.length}</p>
        </div>
      </div>

      {/* Top categories */}
      {Object.keys(catSpending).length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Top Spending</p>
          {Object.entries(catSpending).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, val]) => (
            <div key={name} className="flex justify-between text-xs py-0.5">
              <span className="text-card-foreground">{name}</span>
              <span className="text-muted-foreground font-medium">${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
