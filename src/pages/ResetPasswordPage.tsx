import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import kashCool from '@/assets/kash-cool.png';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your email for the reset link! 📧");
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <img src={kashCool} alt="Kash" className="w-20 h-20 mx-auto object-contain" />
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            {sent ? "Kash sent a reset link to your inbox! 📬" : "Forgot your password? Kash will help you out 🐱"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="rounded-3xl bg-card p-6 shadow-card space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground touch-target disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="rounded-3xl bg-card p-6 shadow-card text-center">
            <p className="text-sm text-card-foreground">Check your email and click the link to reset your password.</p>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <a href="/" className="text-primary font-medium">Back to Sign In</a>
        </p>
      </div>
    </div>
  );
}
