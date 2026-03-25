import { useState } from 'react';
import { AppData, Transaction } from '@/lib/types';
import { generateId, getLiveMonthKey } from '@/lib/store';
import { Plus } from 'lucide-react';
import TransactionRow from '@/components/TransactionRow';

interface TransactionsProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

export default function Transactions({ data, updateData }: TransactionsProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState(data.categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const getDefaultDate = () => `${getLiveMonthKey(data.transactions)}-01`;
  const [date, setDate] = useState(getDefaultDate());
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));

  const grouped = sorted.reduce<Record<string, Transaction[]>>((acc, t) => {
    (acc[t.date] ||= []).push(t);
    return acc;
  }, {});

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setDate(getDefaultDate());
  };

  const addTransaction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !description.trim()) return;

    if (editingId) {
      updateData(d => ({
        ...d,
        transactions: d.transactions.map(t =>
          t.id === editingId ? { ...t, date, categoryId, description: description.trim(), amount: val, type } : t
        ),
      }));
    } else {
      updateData(d => ({
        ...d,
        hasSeenWelcome: true,
        transactions: [...d.transactions, {
          id: generateId(), date, categoryId, description: description.trim(), amount: val, type,
        }],
      }));
    }
    resetForm();
  };

  const deleteTransaction = (id: string) => {
    updateData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setCategoryId(t.categoryId);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setDate(t.date);
    setShowForm(true);
  };

  const getCatName = (id: string) => data.categories.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Transactions</h2>

      {Object.entries(grouped).map(([date, txns]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="space-y-2">
            {txns.map(t => (
              <TransactionRow
                key={t.id}
                transaction={t}
                categoryName={getCatName(t.categoryId)}
                onDelete={deleteTransaction}
                onEdit={startEdit}
              />
            ))}
          </div>
        </div>
      ))}

      {sorted.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">No transactions yet. Tap + to add one!</p>
      )}

      {/* FAB */}
      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg text-primary-foreground touch-target"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add/Edit Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-lg rounded-t-3xl bg-card p-6 pb-[100px] space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>

            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium touch-target transition-colors ${
                    type === t
                      ? t === 'income' ? 'bg-income text-income-foreground' : 'bg-alert text-alert-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t === 'income' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>

            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />

            {type === 'expense' && (
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <input
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <input
              type="number"
              inputMode="decimal"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <button onClick={addTransaction} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground touch-target">
              {editingId ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
