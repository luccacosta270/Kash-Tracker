import { Home, ArrowLeftRight, PieChart, Settings, User, ArrowLeft } from 'lucide-react';

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
  isViewingArchive?: boolean;
  onExitArchive?: () => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budget', label: 'Budget', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ active, onNavigate, isViewingArchive, onExitArchive }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      {isViewingArchive && (
        <div className="bg-income/10 px-4 py-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-income">Viewing archived month</span>
          <button onClick={onExitArchive} className="text-xs font-semibold text-income flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to current
          </button>
        </div>
      )}
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`touch-target flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
