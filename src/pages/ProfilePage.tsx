import { useState, useRef } from 'react';
import { AppData } from '@/lib/types';
import { archiveMonth } from '@/lib/store';
import { User, Camera, Archive, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
  onViewMonth: (monthKey: string) => void;
}

export default function ProfilePage({ data, updateData, onViewMonth }: ProfileProps) {
  const [nameInput, setNameInput] = useState(data.profile.name);
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
