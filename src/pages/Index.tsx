import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Budget from '@/pages/Budget';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import HistoryPage from '@/pages/HistoryPage';
import { useAppData } from '@/hooks/useAppData';

const Index = () => {
  const [page, setPage] = useState('home');
  const { data, updateData } = useAppData();

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('kash-theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kash-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const isViewingArchive = data.viewingMonth !== null && data.viewingMonth !== undefined;

  const handleNavigate = (p: string) => {
    if (p === 'profile' && isViewingArchive) {
      updateData(d => ({ ...d, viewingMonth: null }));
    }
    setPage(p);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Header userName={data.profile.name || undefined} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
      <div className="transition-opacity duration-200">
        {isViewingArchive && page !== 'profile' && page !== 'settings' ? (
          <HistoryPage data={data} updateData={updateData} page={page} />
        ) : (
          <>
            {page === 'home' && <Dashboard data={data} updateData={updateData} />}
            {page === 'transactions' && <Transactions data={data} updateData={updateData} />}
            {page === 'budget' && <Budget data={data} updateData={updateData} />}
            {page === 'settings' && <SettingsPage data={data} updateData={updateData} />}
            {page === 'profile' && <ProfilePage data={data} updateData={updateData} onViewMonth={(mk) => { updateData(d => ({ ...d, viewingMonth: mk })); setPage('home'); }} />}
          </>
        )}
      </div>
      <BottomNav active={page} onNavigate={handleNavigate} isViewingArchive={isViewingArchive} onExitArchive={() => updateData(d => ({ ...d, viewingMonth: null }))} />
    </div>
  );
};

export default Index;
