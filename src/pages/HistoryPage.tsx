import { useState, useMemo } from 'react';
import { AppData, Transaction } from '@/lib/types';
import { generateId, getSpendingByCategory } from '@/lib/store';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import TransactionRow from '@/components/TransactionRow';
import MonthlyInsight from '@/components/MonthlyInsight';

interface HistoryPageProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
  page: string; // 'home' | 'transactions' | 'budget'
}

export default function HistoryPage({ data, updateData, page }: HistoryPageProps) {
  const monthKey = data.viewingMonth!;
  const archive = data.archives.find(a => a.monthKey === monthKey);

  if (!archive) return <div className="px-4 pt-4"><p className="text-muted-foreground">Archive not found.</p></div>;

  if (page === 'home') return <HistoryDashboard archive={archive} />;
  if (page === 'transactions') return <HistoryTransactions archive={archive} data={data} updateData={updateData} />;
  if (page === 'budget') return <HistoryBudget archive={archive} />;

  return null;
}

function HistoryDashboard({ archive, userName }: { archive: AppData['archives'][0]; userName?: string }) {
  return (
    <div className="space-y-4 px-4 pt-4 pb-24">
      <div className="rounded-3xl bg-income/10 p-3 text-center">
        <p className="text-sm font-semibold text-income">📅 {archive.label}</p>
      </div>

      <MonthlyInsight archive={archive} userName={userName} />

      <StatCard icon={<Wallet className="h-5 w-5" />} label="Net Balance" value={archive.totalIncome - archive.totalExpense} colorClass={(archive.totalIncome - archive.totalExpense) >= 0 ? 'text-savings' : 'text-alert'} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Total Spent" value={-archive.totalExpense} colorClass="text-alert" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Income" value={archive.totalIncome} colorClass="text-income" />
      </div>
    </div>
  );
}

function HistoryTransactions({ archive, data, updateData }: { archive: AppData['archives'][0]; data: AppData; updateData: (updater: (prev: AppData) => AppData) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState(archive.categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(`${archive.monthKey}-15`);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...archive.transactions].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = sorted.reduce<Record<string, Transaction[]>>((acc, t) => {
    (acc[t.date] ||= []).push(t);
    return acc;
  }, {});

  const getCatName = (id: string) => archive.categories.find(c => c.id === id)?.name || 'Unknown';

  const updateArchive = (updater: (txns: Transaction[]) => Transaction[]) => {
    updateData(d => {
      const newArchives = d.archives.map(a => {
        if (a.monthKey !== archive.monthKey) return a;
        const newTxns = updater(a.transactions);
        const totalIncome = newTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = newTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { ...a, transactions: newTxns, totalIncome, totalExpense, totalSaved: Math.max(0, totalIncome - totalExpense) };
      });
      return { ...d, archives: newArchives };
    });
  };

  const resetForm = () => { setShowForm(false); setEditingId(null); setDescription(''); setAmount(''); setType('expense'); setDate(`${archive.monthKey}-15`); };

  const addTransaction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !description.trim()) return;
    if (editingId) {
      updateArchive(txns => txns.map(t => t.id === editingId ? { ...t, date, categoryId, description: description.trim(), amount: val, type } : t));
    } else {
      updateArchive(txns => [...txns, { id: generateId(), date, categoryId, description: description.trim(), amount: val, type }]);
    }
    resetForm();
  };

  const deleteTransaction = (id: string) => updateArchive(txns => txns.filter(t => t.id !== id));

  const startEdit = (t: Transaction) => {
    setEditingId(t.id); setType(t.type); setCategoryId(t.categoryId); setDescription(t.description); setAmount(t.amount.toString()); setDate(t.date); setShowForm(true);
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="rounded-3xl bg-income/10 p-3 text-center">
        <p className="text-sm font-semibold text-income">📅 {archive.label} — Transactions</p>
      </div>

      {Object.entries(grouped).map(([d, txns]) => (
        <div key={d}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="space-y-2">
            {txns.map(t => (
              <TransactionRow key={t.id} transaction={t} categoryName={getCatName(t.categoryId)} onDelete={deleteTransaction} onEdit={startEdit} />
            ))}
          </div>
        </div>
      ))}

      {sorted.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No transactions in this month.</p>}

      <button onClick={() => { resetForm(); setShowForm(true); }} className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg text-primary-foreground touch-target">
        <Plus className="h-6 w-6" />
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-lg rounded-t-3xl bg-card p-6 pb-[100px] space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} className={`flex-1 rounded-xl py-2.5 text-sm font-medium touch-target transition-colors ${type === t ? t === 'income' ? 'bg-income text-income-foreground' : 'bg-alert text-alert-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {t === 'income' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {type === 'expense' && (
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                {archive.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input type="number" inputMode="decimal" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={addTransaction} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground touch-target">
              {editingId ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryBudget({ archive }: { archive: AppData['archives'][0] }) {
  const spending = useMemo(() => getSpendingByCategory(archive.transactions, archive.categories, archive.monthKey), [archive]);

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="rounded-3xl bg-income/10 p-3 text-center">
        <p className="text-sm font-semibold text-income">📅 {archive.label} — Budget</p>
      </div>
      {spending.map(({ category, actual, difference, percentage }) => {
        const isOver = actual > category.planned && category.planned > 0;
        return (
          <div key={category.id} className="rounded-3xl bg-card p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${isOver ? 'text-alert' : 'text-card-foreground'}`}>{category.name}</h3>
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
                <div className={`h-full rounded-full transition-all ${isOver ? 'bg-alert' : 'bg-savings'}`} style={{ width: `${Math.min(100, percentage)}%` }} />
              </div>
            )}
          </div>
        );
      })}
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
