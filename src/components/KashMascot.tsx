import { useState, useEffect } from 'react';
import { KashState } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import kashHappy from '@/assets/kash-happy.png';
import kashCool from '@/assets/kash-cool.png';
import kashAlert from '@/assets/kash-alert.png';

interface KashProps {
  state: KashState;
  overBudgetCategory?: string;
  userName?: string;
  autoLoggedCount?: number;
  autoLoggedNames?: string[];
  totalIncome?: number;
  totalExpense?: number;
  netBalance?: number;
}

function greet(name?: string) {
  return name ? `, ${name}` : '';
}

const fallbackMessages: Record<KashState, (name?: string, cat?: string) => string> = {
  welcome: (name) => `Meow! Welcome to KASH Tracker${name ? `, ${name}` : ''}! I'm Kash, your finance-friendly feline. Let's start stacking that cash — set a savings goal or log your first transaction. Stay paws-itive! 🐾`,
  happy: (name) => `Purr-fect${greet(name)}! We're stacking that cash now! Your meow-ney game is looking strong today! 💰`,
  cool: (name) => `Just keeping an eye on the vault${greet(name)}. Everything is steady. Meow-ney well spent! 😎`,
  alert: (name, cat) => `Hiss! You're stretching the budget too thin${greet(name)}! ${cat || 'A category'} is over the limit. Let's paws and rethink this. 🙀`,
  newmonth: (name) => `Meow! New month, fresh starts${greet(name)}! Let's make this one count. 🐱`,
  darkmode: (name) => `Meow${greet(name)}! Much better. These bright lights were killing my night vision. Let's track some stacks in the dark! 🌙`,
};

const images: Record<KashState, string> = {
  welcome: kashHappy,
  happy: kashHappy,
  cool: kashCool,
  alert: kashAlert,
  newmonth: kashHappy,
  darkmode: kashCool,
};

export default function KashMascot({ state, overBudgetCategory, userName, autoLoggedCount, autoLoggedNames, totalIncome, totalExpense, netBalance }: KashProps) {
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Fetch AI greeting on mount (only for non-welcome, non-alert states)
  useEffect(() => {
    if (state === 'welcome' || state === 'alert') return;
    
    let cancelled = false;
    const fetchGreeting = async () => {
      setLoadingAi(true);
      try {
        const { data, error } = await supabase.functions.invoke('kash-greeting', {
          body: {
            type: 'greeting',
            userName: userName || '',
            totalIncome: totalIncome || 0,
            totalExpense: totalExpense || 0,
            netBalance: netBalance || 0,
          },
        });
        if (!cancelled && data?.message) setAiMessage(data.message);
      } catch {
        // Use fallback
      } finally {
        if (!cancelled) setLoadingAi(false);
      }
    };
    fetchGreeting();
    return () => { cancelled = true; };
  }, [state, userName]);

  const fallback = fallbackMessages[state](userName, overBudgetCategory);
  const message = (state === 'welcome' || state === 'alert') ? fallback : (aiMessage || fallback);

  return (
    <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-card animate-bounce-in">
      <img
        src={images[state]}
        alt="Kash the Cat"
        className="w-[100px] h-[100px] object-contain flex-shrink-0"
      />
      <p className="text-sm leading-relaxed text-card-foreground">
        {loadingAi && !aiMessage ? (
          <span className="animate-pulse">{fallback}</span>
        ) : message}
      </p>
    </div>
  );
}
