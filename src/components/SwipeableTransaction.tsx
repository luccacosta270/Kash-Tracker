import { useState, useRef } from 'react';
import { Transaction } from '@/lib/types';
import { Trash2, Edit2 } from 'lucide-react';

interface Props {
  transaction: Transaction;
  categoryName: string;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

export default function SwipeableTransaction({ transaction: t, categoryName, onDelete, onEdit }: Props) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    // Clamp between -80 and 80
    setOffsetX(Math.max(-80, Math.min(80, diff)));
  };

  const handleTouchEnd = () => {
    dragging.current = false;
    if (offsetX < -50) {
      setOffsetX(-80); // reveal delete
    } else if (offsetX > 50) {
      setOffsetX(80); // reveal edit
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Edit bg (right swipe) */}
      <div className="absolute inset-y-0 left-0 w-20 bg-income flex items-center justify-center">
        <button onClick={() => { onEdit(t); setOffsetX(0); }} className="touch-target p-2 text-income-foreground">
          <Edit2 className="h-5 w-5" />
        </button>
      </div>
      {/* Delete bg (left swipe) */}
      <div className="absolute inset-y-0 right-0 w-20 bg-alert flex items-center justify-center">
        <button onClick={() => onDelete(t.id)} className="touch-target p-2 text-alert-foreground">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative bg-card p-4 shadow-card transition-transform"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-card-foreground truncate">{t.description}</p>
            <p className="text-xs text-muted-foreground">{categoryName}</p>
          </div>
          <span className={`text-sm font-bold ${t.type === 'income' ? 'text-income' : 'text-alert'}`}>
            {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
