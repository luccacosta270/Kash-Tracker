import { useState, useRef } from 'react';
import { AppData } from '@/lib/types';
import { archiveMonth, getCurrentMonthKey } from '@/lib/store';
import { User, Camera, Archive, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

export default function ProfilePage({ data, updateData }: ProfileProps) {
  const [nameInput, setNameInput] = useState(data.profile.name);
  const [showArchive, setShowArchive] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveName = () => {
    updateData(d => ({ ...d, profile: { ...d.profile, name: nameInput.trim() } }));
    toast.success('Name saved!');
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      updateData(d => ({ ...d, profile: { ...d.profile, avatarUrl: url } }));
    };
    reader.readAsDataURL(file);
  };

  const handleCloseMonth = () => {
    if (!confirm('Archive this month and reset spending? Planned budgets and fixed items will carry over.')) return;
    updateData(d => {
      const { archived } = archiveMonth(d);
      return archived;
    });
    toast.success('Month archived! Spending reset.');
  };

  const selectedArchive = data.archives.find(a => a.monthKey === showArchive);

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Profile</h2>

      {/* Avatar & Name */}
      <div className="rounded-3xl bg-card p-5 shadow-card flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {data.profile.avatarUrl ? (
              <img src={data.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground touch-target"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
        </div>

        <div className="w-full space-y-2">
          <input
            placeholder="Your name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            className="w-full rounded-xl bg-muted px-3 py-2.5 text-sm text-center outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={saveName} className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground touch-target">
            Save Name
          </button>
        </div>
      </div>

      {/* Close Month */}
      <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" /> Monthly Management
        </h3>
        <p className="text-xs text-muted-foreground">
          Close the current month to archive your data and start fresh. Planned budgets carry over.
        </p>
        <button onClick={handleCloseMonth} className="w-full rounded-xl bg-income py-2.5 text-sm font-medium text-income-foreground touch-target">
          Close &amp; Archive This Month
        </button>
      </div>

      {/* Past Months */}
      {data.archives.length > 0 && (
        <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
          <h3 className="text-sm font-semibold text-card-foreground">Past Months</h3>
          <div className="space-y-2">
            {[...data.archives].reverse().map(a => (
              <button
                key={a.monthKey}
                onClick={() => setShowArchive(a.monthKey)}
                className="flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm text-card-foreground touch-target"
              >
                <span>{a.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Archive Detail Modal */}
      {selectedArchive && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setShowArchive(null)}>
          <div className="w-full max-w-lg max-h-[80vh] rounded-t-3xl bg-card p-6 space-y-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-card-foreground">{selectedArchive.label}</h3>
              <button onClick={() => setShowArchive(null)} className="touch-target p-2 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="text-sm font-bold text-income">${selectedArchive.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-sm font-bold text-alert">${selectedArchive.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-sm font-bold text-savings">${selectedArchive.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-card-foreground">Transactions</h4>
            <div className="space-y-2">
              {selectedArchive.transactions.length === 0 && <p className="text-xs text-muted-foreground">No transactions.</p>}
              {selectedArchive.transactions.map(t => {
                const catName = selectedArchive.categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                    <div>
                      <p className="text-sm text-card-foreground">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{catName}</p>
                    </div>
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-income' : 'text-alert'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
