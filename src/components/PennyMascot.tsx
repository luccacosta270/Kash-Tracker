import { PennyState } from '@/lib/types';
import pennyHappy from '@/assets/penny-happy.png';
import pennyAlert from '@/assets/penny-alert.png';
import pennyWorried from '@/assets/penny-worried.png';

interface PennyProps {
  state: PennyState;
  overBudgetCategory?: string;
}

const messages: Record<PennyState, string | ((cat?: string) => string)> = {
  welcome: "Oink! Welcome to MyTracker! I'm Penny, your financial co-pilot. Start by setting your savings goal or just log your first transaction. Let's keep those charts green and your wallet happy!",
  highfive: "Looking good! We're well under budget. You're doing a great job managing your money today!",
  steady: "Right on target. Everything is flowing exactly as planned. Keep it up!",
  sweat: (cat) => `Oof, we're cutting it close! Just a heads up—we've hit the limit for ${cat || 'a category'}.`,
  rescue: (cat) => `Change of plans! We've gone over in ${cat || 'a category'}. Let's see where we can trim back to save the month.`,
};

const images: Record<PennyState, string> = {
  welcome: pennyHappy,
  highfive: pennyHappy,
  steady: pennyAlert,
  sweat: pennyWorried,
  rescue: pennyWorried,
};

export default function PennyMascot({ state, overBudgetCategory }: PennyProps) {
  const msgDef = messages[state];
  const message = typeof msgDef === 'function' ? msgDef(overBudgetCategory) : msgDef;

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
