import { useState } from 'react';
import { InsightPreferences, InsightCategory, InsightRefresh, InsightLength, DEFAULT_INSIGHT_PREFS } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, PiggyBank, Bot, BarChart3, Cat, Eye, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  preferences: InsightPreferences;
  userName: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  onChange: (prefs: InsightPreferences) => void;
}

const CATEGORY_OPTIONS: { id: InsightCategory; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'smart', label: 'Smart Financial Insights', description: 'Budget progress, trends, savings pace', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'savings', label: 'Savings Motivation', description: 'Encouragement to keep saving', icon: <PiggyBank className="h-4 w-4" /> },
  { id: 'coach', label: 'AI Budget Coach', description: 'Recommendations based on habits', icon: <Bot className="h-4 w-4" /> },
  { id: 'summary', label: 'Monthly Expense Summary', description: 'Top categories, totals, remaining', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'funny', label: 'Funny Mascot Messages', description: 'Playful cat puns about money', icon: <Cat className="h-4 w-4" /> },
];

const REFRESH_OPTIONS: { id: InsightRefresh; label: string }[] = [
  { id: 'open', label: 'Every app open' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
];

const LENGTH_OPTIONS: { id: InsightLength; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'detailed', label: 'Detailed' },
];

export default function HomeInsightPreferences({ preferences, userName, totalIncome, totalExpense, netBalance, onChange }: Props) {
  const prefs = preferences || DEFAULT_INSIGHT_PREFS;
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const toggleCategory = (cat: InsightCategory) => {
    const has = prefs.categories.includes(cat);
    let next = has ? prefs.categories.filter(c => c !== cat) : [...prefs.categories, cat];
    if (next.length === 0) next = ['smart']; // default fallback
    onChange({ ...prefs, categories: next });
  };

  const setRefresh = (r: InsightRefresh) => onChange({ ...prefs, refresh: r });
  const setLength = (l: InsightLength) => onChange({ ...prefs, length: l });
  const setHumor = (h: boolean) => onChange({ ...prefs, humor: h });
  const setEnabled = (e: boolean) => onChange({ ...prefs, enabled: e });

  const generatePreview = async () => {
    setPreviewLoading(true);
    try {
      const category = prefs.categories[0] || 'smart';
      const { data, error } = await supabase.functions.invoke('kash-greeting', {
        body: {
          type: 'greeting',
          userName,
          totalIncome,
          totalExpense,
          netBalance,
          category,
          length: prefs.length,
          humor: prefs.humor,
        },
      });
      if (error) throw error;
      if (data?.message) {
        setPreviewMessage(data.message);
      } else {
        toast.error("Hiss! Couldn't fetch preview.");
      }
    } catch {
      toast.error("Hiss! Couldn't fetch preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-card p-5 shadow-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Home Insight Preferences</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Pick what Kash says on your dashboard.</p>
        </div>
        <Toggle checked={prefs.enabled} onChange={setEnabled} />
      </div>

      {prefs.enabled && (
        <>
          {/* Categories */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insight Categories</p>
            <p className="text-xs text-muted-foreground">Select one or more. Multiple = rotates daily.</p>
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map(opt => {
                const checked = prefs.categories.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleCategory(opt.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors touch-target ${
                      checked ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                    </div>
                    <div className={`h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center ${checked ? 'border-primary bg-primary' : 'border-border'}`}>
                      {checked && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh frequency */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Refresh Frequency</p>
            <div className="grid grid-cols-3 gap-2">
              {REFRESH_OPTIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setRefresh(o.id)}
                  className={`rounded-xl py-2 text-xs font-medium touch-target ${
                    prefs.refresh === o.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message Length</p>
            <div className="grid grid-cols-2 gap-2">
              {LENGTH_OPTIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setLength(o.id)}
                  className={`rounded-xl py-2 text-xs font-medium touch-target ${
                    prefs.length === o.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Humor toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium text-card-foreground">Mascot Humor</p>
              <p className="text-xs text-muted-foreground">Cat puns and sassy tone</p>
            </div>
            <Toggle checked={prefs.humor} onChange={setHumor} />
          </div>

          {/* Preview */}
          <div className="space-y-2 rounded-2xl border border-dashed border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview Today's Insight
              </p>
              <button
                onClick={generatePreview}
                disabled={previewLoading}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary touch-target disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${previewLoading ? 'animate-spin' : ''}`} />
                {previewMessage ? 'Refresh' : 'Generate'}
              </button>
            </div>
            <p className="text-sm text-card-foreground min-h-[3rem]">
              {previewLoading
                ? <span className="animate-pulse text-muted-foreground">Kash is thinking...</span>
                : previewMessage || <span className="text-muted-foreground italic text-xs">Tap Generate to see what Kash will say.</span>}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors touch-target ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-card shadow-md transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
