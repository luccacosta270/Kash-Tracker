import { PennyState } from '@/lib/types';
import pennyHappy from '@/assets/penny-happy.png';
import pennyAlert from '@/assets/penny-alert.png';
import pennyWorried from '@/assets/penny-worried.png';

interface PennyProps {
  state: PennyState;
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

const messages: Record<PennyState, (name?: string, cat?: string, count?: number, names?: string[]) => string> = {
  welcome: (name) => `Oink! Welcome to MyTracker${name ? `, ${name}` : ''}! I'm Penny, your financial co-pilot. Start by setting your savings goal or just log your first transaction. Let's keep those charts green and your wallet happy!`,
  highfive: (name) => `Looking good${greet(name)}! We're well under budget. You're doing a great job managing your money today!`,
  steady: (name) => `Right on target${greet(name)}. Everything is flowing exactly as planned. Keep it up!`,
  sweat: (name, cat) => `Oof${greet(name)}, we're cutting it close! Just a heads up—we've hit the limit for ${cat || 'a category'}.`,
  rescue: (name, cat) => `Change of plans${greet(name)}! We've gone over in ${cat || 'a category'}. Let's see where we can trim back to save the month.`,
  newmonth: (name, _cat, count, names) => `Oink! I've copied your ${count || 0} recurring item${count === 1 ? '' : 's'} as individual transactions for you${greet(name)}. No combining allowed! Your ${formatAutoLoggedNames(names)} ${count === 1 ? 'is' : 'are'} already accounted for!`,
};

const images: Record<PennyState, string> = {
  welcome: pennyHappy,
  highfive: pennyHappy,
  steady: pennyAlert,
  sweat: pennyWorried,
  rescue: pennyWorried,
  newmonth: pennyHappy,
};

export default function PennyMascot({ state, overBudgetCategory, userName, autoLoggedCount, autoLoggedNames }: PennyProps) {
  const message = messages[state](userName, overBudgetCategory, autoLoggedCount, autoLoggedNames);

  return (
    <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-card animate-bounce-in">
      <img
        src={images[state]}
        alt="Penny the Pig"
        className="w-16 h-16 object-contain flex-shrink-0"
      />
      <p className="text-sm leading-relaxed text-card-foreground">{message}</p>
    </div>
  );
}
