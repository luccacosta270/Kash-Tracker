import { useState } from 'react';
import { AppData } from '@/lib/types';
import { generateId } from '@/lib/store';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface SettingsProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

export default function SettingsPage({ data, updateData }: SettingsProps) {
  const [newName, setNewName] = useState('');
  const [newPlanned, setNewPlanned] = useState('');
  const [newFixed, setNewFixed] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlanned, setEditPlanned] = useState('');
  const [editFixed, setEditFixed] = useState(false);

  const addCategory = () => {
    if (!newName.trim()) return;
    const planned = parseFloat(newPlanned);
    updateData(d => ({
      ...d,
      categories: [...d.categories, {
        id: generateId(),
        name: newName.trim(),
        planned: isNaN(planned) ? 0 : planned,
        isFixed: newFixed,
      }],
    }));
    setNewName('');
    setNewPlanned('');
    setNewFixed(false);
  };

  const deleteCategory = (id: string) => {
    updateData(d => ({
      ...d,
      categories: d.categories.filter(c => c.id !== id),
      transactions: d.transactions.filter(t => t.categoryId !== id),
    }));
  };

  const startEdit = (id: string) => {
    const cat = data.categories.find(c => c.id === id);
    if (!cat) return;
    setEditId(id);
    setEditName(cat.name);
    setEditPlanned(cat.planned.toString());
    setEditFixed(cat.isFixed);
  };

  const saveEdit = () => {
    if (!editId || !editName.trim()) return;
    const planned = parseFloat(editPlanned);
    updateData(d => ({
      ...d,
      categories: d.categories.map(c =>
        c.id === editId ? { ...c, name: editName.trim(), planned: isNaN(planned) ? 0 : planned, isFixed: editFixed } : c
      ),
    }));
    setEditId(null);
  };

  const resetAll = () => {
    if (confirm('This will delete ALL data. Are you sure?')) {
      localStorage.removeItem('mytracker-data');
      window.location.reload();
    }
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-6">
      <h2 className="text-lg font-bold text-foreground">Category Manager</h2>

      {/* Add Category */}
      <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground">Add Category</h3>
        <input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)}
          className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input type="number" inputMode="decimal" placeholder="Planned budget" value={newPlanned} onChange={e => setNewPlanned(e.target.value)}
          className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <label className="flex items-center gap-2 text-sm text-card-foreground">
          <input type="checkbox" checked={newFixed} onChange={e => setNewFixed(e.target.checked)} className="rounded" />
          Fixed/Recurring
        </label>
        <button onClick={addCategory} className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground touch-target">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-2">
        {data.categories.map(cat => (
          <div key={cat.id} className="rounded-3xl bg-card p-4 shadow-card">
            {editId === cat.id ? (
              <div className="space-y-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <input type="number" inputMode="decimal" value={editPlanned} onChange={e => setEditPlanned(e.target.value)}
                  className="w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <label className="flex items-center gap-2 text-sm text-card-foreground">
                  <input type="checkbox" checked={editFixed} onChange={e => setEditFixed(e.target.checked)} className="rounded" />
                  Fixed
                </label>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="rounded-xl bg-savings px-3 py-2 text-sm text-savings-foreground touch-target"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditId(null)} className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground touch-target"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{cat.name} {cat.isFixed && <span className="text-xs text-muted-foreground">(Fixed)</span>}</p>
                  <p className="text-xs text-muted-foreground">Planned: ${cat.planned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(cat.id)} className="touch-target p-2 text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteCategory(cat.id)} className="touch-target p-2 text-muted-foreground hover:text-alert"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reset */}
      <button onClick={resetAll} className="w-full rounded-xl bg-destructive py-3 text-sm font-medium text-destructive-foreground touch-target">
        Reset All Data
      </button>
    </div>
  );
}
