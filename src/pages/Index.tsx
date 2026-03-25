import { useState } from 'react';
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

  const isViewingArchive = data.viewingMonth !== null && data.viewingMonth !== undefined;

  const handleNavigate = (p: string) => {
    // If navigating away from history context, clear it
    if (p === 'profile' && isViewingArchive) {
      updateData(d => ({ ...d, viewingMonth: null }));
    }
    setPage(p);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Header />
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
