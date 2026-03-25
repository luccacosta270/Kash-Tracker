import { KashState } from '@/lib/types';
import kashHappy from '@/assets/kash-happy.png';
import kashCool from '@/assets/kash-cool.png';
import kashAlert from '@/assets/kash-alert.png';

interface KashProps {
  state: KashState;
  overBudgetCategory?: string;
  userName?: string;
  autoLoggedCount?: number;
  autoLoggedNames?: string[];
}

function greet(name?: string) {
  return name ? `, ${name}` : '';
}

function formatAutoLoggedNames(names?: string[]) {
  if (!names || names.length === 0) return 'recurring expenses';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

const messages: Record<KashState, (name?: string, cat?: string, count?: number, names?: string[]) => string> = {
  welcome: (name) => `Meow! Welcome to KASH Tracker${name ? `, ${name}` : ''}! I'm Kash, your finance-friendly feline. Let's start stacking that cash — set a savings goal or log your first transaction. Stay paws-itive! 🐾`,
  happy: (name) => `Purr-fect${greet(name)}! We're stacking that cash now! Your meow-ney game is looking strong today! 💰`,
  cool: (name) => `Just keeping an eye on the vault${greet(name)}. Everything is steady. Meow-ney well spent! 😎`,
  alert: (name, cat) => `Hiss! You're stretching the budget too thin${greet(name)}! ${cat || 'A category'} is over the limit. Let's paws and rethink this. 🙀`,
  newmonth: (name, _cat, count, names) => `Meow! New month, new moves${greet(name)}! I've rolled over your ${formatAutoLoggedNames(names)} — that's ${count} transaction${count === 1 ? '' : 's'} already locked in. No fur-getting the essentials! 🐱`,
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

export default function KashMascot({ state, overBudgetCategory, userName, autoLoggedCount, autoLoggedNames }: KashProps) {
  const message = messages[state](userName, overBudgetCategory, autoLoggedCount, autoLoggedNames);

  return (
    <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-card animate-bounce-in">
      <img
        src={images[state]}
        alt="Kash the Cat"
        className="w-[100px] h-[100px] object-contain flex-shrink-0"
      />
      <p className="text-sm leading-relaxed text-card-foreground">{message}</p>
    </div>
  );
}
