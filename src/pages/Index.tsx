import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Budget from '@/pages/Budget';
import SettingsPage from '@/pages/SettingsPage';
import { useAppData } from '@/hooks/useAppData';

const Index = () => {
  const [page, setPage] = useState('home');
  const { data, updateData } = useAppData();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Header />
      {page === 'home' && <Dashboard data={data} updateData={updateData} />}
      {page === 'transactions' && <Transactions data={data} updateData={updateData} />}
      {page === 'budget' && <Budget data={data} />}
      {page === 'settings' && <SettingsPage data={data} updateData={updateData} />}
      <BottomNav active={page} onNavigate={setPage} />
    </div>
  );
};

export default Index;
