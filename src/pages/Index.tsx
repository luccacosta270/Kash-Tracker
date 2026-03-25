import { useState, useCallback, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Budget from '@/pages/Budget';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import { useAppData } from '@/hooks/useAppData';

const pages = ['home', 'transactions', 'budget', 'settings', 'profile'];

const Index = () => {
  const [page, setPage] = useState('home');
  const { data, updateData } = useAppData();

  // Swipe navigation between screens
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const currentIdx = pages.indexOf(page);
      if (dx < 0 && currentIdx < pages.length - 1) {
        setPage(pages[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        setPage(pages[currentIdx - 1]);
      }
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Header />
      <div
        ref={containerRef}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        className="transition-opacity duration-200"
      >
        {page === 'home' && <Dashboard data={data} updateData={updateData} />}
        {page === 'transactions' && <Transactions data={data} updateData={updateData} />}
        {page === 'budget' && <Budget data={data} />}
        {page === 'settings' && <SettingsPage data={data} updateData={updateData} />}
        {page === 'profile' && <ProfilePage data={data} updateData={updateData} />}
      </div>
      <BottomNav active={page} onNavigate={setPage} />
    </div>
  );
};

export default Index;
