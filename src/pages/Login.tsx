import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-city.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, role } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.race([
        signIn(email, password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Sign in is taking too long. Please try again.')), 12000)
        ),
      ]);
      toast.success('Logged in successfully!');
      // Query role directly from DB — no async state race condition
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        const r = roleData?.role;
        if (r === 'admin') navigate('/admin');
        else if (r === 'officer') navigate('/officer');
        else navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden">
        <img src={heroImage} alt="city" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-slate-900/80" />
        <div className="relative p-8">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-white">
            <MapPin className="h-6 w-6" /> Voice4City
          </Link>
        </div>
        <div className="relative p-8">
          <blockquote className="text-white/80">
            <p className="mb-4 text-2xl font-heading font-semibold text-white leading-snug">
              "Empowering citizens,<br />enabling transparent governance."
            </p>
            <p className="text-sm">Report civic issues and track resolutions in real-time.</p>
          </blockquote>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 font-heading text-xl font-bold text-primary lg:hidden">
            <MapPin className="h-5 w-5" /> Voice4City
          </Link>

          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-foreground">{t('login_title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('login_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('login_email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-11"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t('login_password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 gap-2 text-base font-semibold" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('login_loading')}</>
              ) : (
                <>{t('login_btn')} <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('login_no_account')}{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              {t('login_register_link')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
