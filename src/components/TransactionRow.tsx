import { Transaction } from '@/lib/types';
import { X, Edit2 } from 'lucide-react';

interface Props {
  transaction: Transaction;
  categoryName: string;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
  readOnly?: boolean;
}

export default function TransactionRow({ transaction: t, categoryName, onDelete, onEdit, readOnly }: Props) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-card-foreground truncate">{t.description}</p>
          <p className="text-xs text-muted-foreground">{categoryName}</p>
        </div>
        <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'income' ? 'text-income' : 'text-alert'}`}>
          {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        {!readOnly && (
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => onEdit(t)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-income transition-colors"
              aria-label="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(t.id)}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-alert text-alert-foreground"
              aria-label="Delete"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
