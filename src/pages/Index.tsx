import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Budget from '@/pages/Budget';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import HistoryPage from '@/pages/HistoryPage';
import AuthPage from '@/pages/AuthPage';
import { useAuth } from '@/hooks/useAuth';
import { useCloudData, SyncStatus } from '@/hooks/useCloudData';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data, updateData, loading: dataLoading, syncStatus } = useCloudData(user?.id);
  const [page, setPage] = useState('home');

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

  // Show auth page if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Kash is fetching your data... 🐱</p>
      </div>
    );
  }

  const isViewingArchive = data.viewingMonth !== null && data.viewingMonth !== undefined;

  const handleNavigate = (p: string) => {
    if (p === 'profile' && isViewingArchive) {
      updateData(d => ({ ...d, viewingMonth: null }));
    }
    setPage(p);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Header
        userName={data.profile.name || undefined}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        syncStatus={syncStatus}
        onSignOut={signOut}
      />
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
