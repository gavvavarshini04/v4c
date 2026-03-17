import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { MapPin, Eye, EyeOff, Loader2, ArrowRight, User2, Building2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-city.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<'citizen' | 'officer' | 'admin'>('citizen');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('departments').select('*').then(({ data }) => {
      if (data) setDepartments(data);
    });
  }, []);

  // Roles with translated labels (inside component so they react to lang change)
  const rolesTranslated = [
    { value: 'citizen', label: t('register_citizen'), icon: User2, desc: t('register_citizen_desc') },
    { value: 'officer', label: t('register_officer'), icon: Building2, desc: t('register_officer_desc') },
    { value: 'admin', label: t('register_admin'), icon: ShieldCheck, desc: t('register_admin_desc') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, {
        name,
        phone,
        role,
        department_id: (role === 'officer' && departmentId) ? departmentId : undefined
      });
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
        <div className="relative p-8 space-y-4">
          {rolesTranslated.map(r => (
            <div
              key={r.value}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${role === r.value ? 'border-white/40 bg-white/15' : 'border-white/10 bg-white/5'}`}
            >
              <r.icon className="h-5 w-5 text-white shrink-0" />
              <div>
                <p className="font-semibold text-white text-sm">{r.label}</p>
                <p className="text-xs text-white/60">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto">
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
            <h1 className="font-heading text-3xl font-bold text-foreground">{t('register_title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('register_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('register_name')}</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Priya Sharma" className="h-11" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{t('register_email')}</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('register_phone')}</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('register_role')}</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rolesTranslated.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <r.icon className="h-4 w-4 text-muted-foreground" />
                        {r.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'officer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 overflow-hidden"
              >
                <Label htmlFor="department">Select Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId} required>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={departments.length > 0 ? "Pick your department" : "Loading departments..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Fetching departments...
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t('register_password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                  className="h-11 pr-10"
                  minLength={6}
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

            <Button type="submit" className="w-full h-11 gap-2 text-base font-semibold mt-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('loading')}</>
              ) : (
                <>{t('register_btn')} <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('register_have_account')}{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">{t('register_login_link')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
