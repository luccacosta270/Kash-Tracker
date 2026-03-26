import { Moon, Sun, Cloud, LogOut } from 'lucide-react';
import kashCool from '@/assets/kash-cool.png';
import { SyncStatus } from '@/hooks/useCloudData';

interface HeaderProps {
  userName?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  syncStatus?: SyncStatus;
  onSignOut?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Header({ userName, isDark, onToggleTheme, syncStatus = 'synced', onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 pt-5 pb-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <img src={kashCool} alt="Kash" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              {getGreeting()}{userName ? `, ${userName}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">Let's check the stats 📊</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Cloud className={`h-4 w-4 transition-all duration-300 ${
            syncStatus === 'syncing' ? 'text-savings animate-pulse' :
            syncStatus === 'error' ? 'text-orange-400' :
            'text-muted-foreground opacity-50'
          }`} />
          <button
            onClick={onToggleTheme}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-target"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-target"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
