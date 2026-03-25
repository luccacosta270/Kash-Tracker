import { useMemo } from 'react';
import { AppData } from '@/lib/types';
import { getSpendingByCategory } from '@/lib/store';

interface BudgetProps {
  data: AppData;
}

export default function Budget({ data }: BudgetProps) {
  const spending = useMemo(() => getSpendingByCategory(data.transactions, data.categories), [data.transactions, data.categories]);

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Budget Overview</h2>

      {spending.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">Set up categories in Settings first.</p>
      )}

      {spending.map(({ category, actual, difference, percentage }) => {
        const isOver = actual > category.planned && category.planned > 0;
        return (
          <div key={category.id} className="rounded-3xl bg-card p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold ${isOver ? 'text-alert' : 'text-card-foreground'}`}>
                  {category.name} {category.isFixed && <span className="text-xs text-muted-foreground">(Fixed)</span>}
                </h3>
              </div>
              <span className={`text-sm font-bold ${isOver ? 'text-alert' : difference >= 0 ? 'text-savings' : 'text-alert'}`}>
                {difference >= 0 ? '+' : '-'}${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Spent: ${actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>Planned: ${category.planned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {category.planned > 0 && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? 'bg-alert' : 'bg-savings'}`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
